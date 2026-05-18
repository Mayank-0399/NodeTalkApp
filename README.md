"# NodeTalk

A real-time chat application built with Node.js, Express, Socket.IO, and React. Sign up, log in, and chat with other connected users instantly.

## 🎯 Features

- **User Authentication:** Sign up and login with email/password
- **Real-time Messaging:** Chat with multiple users simultaneously using Socket.IO
- **Online Status:** See who's currently online
- **Message History:** View last 50 messages in chat
- **Persistent Storage:** Messages and users stored in MongoDB
- **JWT Authentication:** Secure token-based auth system
- **Responsive UI:** Works on desktop and mobile browsers

## 🛠️ Tech Stack

**Backend:**
- Node.js & Express.js
- Socket.IO for real-time communication
- MongoDB & Mongoose for database
- JWT for authentication
- bcryptjs for password hashing

**Frontend:**
- React with Vite
- Socket.IO client
- Axios for HTTP requests
- CSS for styling

## 📋 Prerequisites

- Node.js (v16+)
- npm or yarn
- MongoDB (local or MongoDB Atlas)
- Git

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Mayank-0399/Nodetalk.git
cd NodeTalk
```

### 2. Set Up Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:

```env
PORT=8000
MONGO_CONNECTION_STRING=mongodb://127.0.0.1:27017/nodetalk
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
```

**For MongoDB Atlas (cloud):**
```env
MONGO_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/nodetalk
```

Start the backend server:

```bash
npm start
```

The backend will run on `http://localhost:8000`

### 3. Set Up Frontend

In a new terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` folder:

```env
VITE_API_URL=http://localhost:8000
```

Start the frontend server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Open in Browser

Visit `http://localhost:5173` and:
1. **Sign up** with a name, email, and password
2. **Log in** with your credentials
3. Open the app in another browser tab/window to test real-time chatting

## 📁 Project Structure

```
NodeTalk/
├── backend/
│   ├── index.js           # Main server file with routes & Socket.IO
│   ├── .env               # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── App.jsx        # Main App component
│   │   └── main.jsx       # Entry point
│   ├── public/            # Static assets (images, sounds)
│   ├── .env               # Environment variables
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
  ```json
  { "name": "John", "email": "john@example.com", "password": "password123" }
  ```

- `POST /api/auth/login` - Log in
  ```json
  { "email": "john@example.com", "password": "password123" }
  ```

- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Log out

## 🔗 Socket.IO Events

### Client Events (Emit)

- `send` - Send a message
  ```javascript
  socket.emit('send', 'Hello, everyone!');
  ```

### Server Events (Listen)

- `chat-history` - Receive last 50 messages on connection
- `receive` - Receive a message from another user
- `user-joined` - Notification when a user joins
- `left` - Notification when a user leaves
- `online-users` - List of currently online users

## 🌐 Deployment on Render
### Deploy Backend

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repository
3. Fill in the form:
   - **Name:** `nodetalk-backend`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node backend/index.js`
4. Add environment variables:
   ```
   PORT=8000
   MONGO_CONNECTION_STRING=your-mongodb-atlas-url
   JWT_SECRET=your-secret-key
   ```
5. Click **Create Web Service**

### Deploy Frontend

1. On Render → **New** → **Static Site**
2. Connect same GitHub repo
3. Fill in:
   - **Name:** `nodetalk-frontend`
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish Directory:** `frontend/dist`
4. Click **Create Static Site**

### Connect Frontend to Backend

Update `frontend/.env`:
```env
VITE_API_URL=https://your-backend-url.onrender.com
```

Redeploy frontend on Render.

## 🗄️ MongoDB Setup

### Local MongoDB

```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongosh  # Connect to MongoDB shell
```

### MongoDB Atlas (Recommended for production)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string: `mongodb+srv://user:password@cluster.mongodb.net/nodetalk`
4. Whitelist your IP address

## 🐛 Troubleshooting

### Backend Error: "Illegal arguments: string, undefined"
- This means a user was created without a password hash
- Delete old users from MongoDB: `db.users.deleteMany({})`

### CORS Issues
- Frontend and backend URLs must match in environment variables
- Check `VITE_API_URL` in frontend `.env`

### MongoDB Connection Failed
- Ensure MongoDB is running locally or check your Atlas connection string
- Verify IP whitelist in MongoDB Atlas

### Chat Not Working with Two Users
- Open two separate browser tabs/windows or use incognito mode
- Both users must be connected to the same Socket.IO server

## 📝 Environment Variables

| Variable | Backend | Frontend | Description |
|----------|---------|----------|-------------|
| `PORT` | ✅ | - | Backend server port (default: 8000) |
| `MONGO_CONNECTION_STRING` | ✅ | - | MongoDB connection URL |
| `JWT_SECRET` | ✅ | - | Secret key for JWT tokens |
| `JWT_EXPIRES_IN` | ✅ | - | Token expiration time (default: 7d) |
| `VITE_API_URL` | - | ✅ | Backend API URL |

## 🔐 Security Notes

- Passwords are hashed with bcryptjs (salt rounds: 12)
- JWT tokens expire after 7 days
- Bearer token authentication for protected routes
- Socket.IO validates tokens before allowing connections

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

**Mayank** - [GitHub](https://github.com/Mayank-0399)

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements!

---

**Made with ❤️ using Node.js and React**" 
