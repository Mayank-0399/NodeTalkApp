const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;
const MONGO_CONNECTION_STRING = process.env.MONGO_CONNECTION_STRING;
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'nodetalk-dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!MONGO_CONNECTION_STRING) {
  console.warn('MONGO_CONNECTION_STRING is missing. Add it to backend/.env before signing up or logging in.');
}

mongoose
  .connect(MONGO_CONNECTION_STRING || 'mongodb://127.0.0.1:27017/nodetalk')
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.error('MongoDB connection failed:', error.message));

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const messageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);
const onlineUsers = new Map();

app.use(express.json({ limit: '1mb' }));

const frontendPath = path.join(__dirname, '../frontend');
const distPath = path.join(frontendPath, 'dist');
const publicPath = path.join(frontendPath, 'public');

app.use(express.static(distPath));
app.get('/chat.png', (req, res) => res.sendFile(path.join(publicPath, 'chat.png')));
app.get('/bgimage.jpg', (req, res) => res.sendFile(path.join(publicPath, 'bgimage.jpg')));
app.get('/ting.mp3', (req, res) => res.sendFile(path.join(publicPath, 'ting.mp3')));

const createToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

const publicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
});

const readBearerToken = (req) => {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  return type === 'Bearer' ? token : null;
};

const requireAuth = async (req, res, next) => {
  try {
    const token = readBearerToken(req);
    const payload = token ? verifyToken(token) : null;

    if (!payload?.sub) {
      return res.status(401).json({ message: 'Please login again.' });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'Account not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Please login again.' });
  }
};

app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (name.length < 2) return res.status(400).json({ message: 'Display name must be at least 2 characters.' });
    if (!email.includes('@')) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    const token = createToken(user);

    res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email });

    if (!user || !user.passwordHash) return res.status(401).json({ message: 'Invalid email or password.' });

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) return res.status(401).json({ message: 'Invalid email or password.' });

    const token = createToken(user);

    res.json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  res.json({ message: 'Logged out.' });
});

const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

const getOnlineUsers = () =>
  Array.from(onlineUsers.values()).map((user) => ({
    id: user.id,
    name: user.name,
  }));

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const payload = token ? verifyToken(token) : null;

    if (!payload?.sub) {
      return next(new Error('Please login again.'));
    }

    const user = await User.findById(payload.sub);
    if (!user) return next(new Error('Account not found.'));

    socket.user = publicUser(user);
    next();
  } catch (error) {
    next(error);
  }
});

io.on('connection', async (socket) => {
  onlineUsers.set(socket.id, socket.user);
  socket.broadcast.emit('user-joined', socket.user.name);
  io.emit('online-users', getOnlineUsers());

  const history = await Message.find().sort({ createdAt: -1 }).limit(50).lean();
  socket.emit(
    'chat-history',
    history.reverse().map((item) => ({
      id: item._id.toString(),
      userId: item.userId.toString(),
      name: item.name,
      message: item.message,
      createdAt: item.createdAt,
    })),
  );

  socket.on('send', async (messageText) => {
    const message = String(messageText || '').trim();
    if (!message) return;

    const savedMessage = await Message.create({
      userId: socket.user.id,
      name: socket.user.name,
      message,
    });

    socket.broadcast.emit('receive', {
      id: savedMessage._id.toString(),
      userId: socket.user.id,
      name: socket.user.name,
      message,
      createdAt: savedMessage.createdAt,
    });
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    socket.broadcast.emit('left', socket.user.name);
    io.emit('online-users', getOnlineUsers());
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Something went wrong.' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
