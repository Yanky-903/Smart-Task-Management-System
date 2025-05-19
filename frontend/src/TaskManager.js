import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TaskManager.css';

function TaskManager() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [userId, setUserId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [commentsMap, setCommentsMap] = useState({});
    const [expandedTasks, setExpandedTasks] = useState({});
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editedCommentContent, setEditedCommentContent] = useState('');
    const [activeView, setActiveView] = useState('create-task');

    useEffect(() => {
        const savedUserId = localStorage.getItem('userId');
        const savedAccessToken = localStorage.getItem('accessToken');
        if (savedUserId) setUserId(savedUserId);
        if (savedAccessToken) setAccessToken(savedAccessToken);
    }, []);

    useEffect(() => {
        if (userId && activeView === 'show-tasks') {
            fetchTasks();
        }
    }, [userId, activeView]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:9091/api/tasks/user/${userId}`);
            setTasks(res.data);
        } catch (err) {
            console.error("Error fetching tasks:", err);
            alert("Error fetching tasks");
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (taskId) => {
        try {
            const res = await axios.get(`http://localhost:9092/api/comments/task/${taskId}`);
            setCommentsMap(prev => ({ ...prev, [taskId]: res.data }));
        } catch (err) {
            console.error("Failed to fetch comments:", err);
        }
    };

    const toggleComments = async (taskId) => {
        const expanded = expandedTasks[taskId];
        setExpandedTasks(prev => ({ ...prev, [taskId]: !expanded }));
        if (!expanded) await fetchComments(taskId);
    };

    const handleAddComment = async (taskId) => {
        if (!commentText.trim()) return;
        try {
            await axios.post(`http://localhost:9092/api/comments`, {
                taskId,
                userId,
                content: commentText
            });
            setCommentText('');
            await fetchComments(taskId);
        } catch (err) {
            console.error("Failed to post comment:", err);
            alert("Failed to post comment");
        }
    };

    const handleDeleteComment = async (commentId, taskId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            await axios.delete(`http://localhost:9092/api/comments/${commentId}`);
            await fetchComments(taskId);
        } catch (err) {
            console.error("Failed to delete comment:", err);
            alert("Failed to delete comment");
        }
    };

    const startEditing = (comment) => {
        setEditingCommentId(comment.id);
        setEditedCommentContent(comment.content);
    };

    const cancelEditing = () => {
        setEditingCommentId(null);
        setEditedCommentContent('');
    };

    const handleUpdateComment = async (comment, taskId) => {
        try {
            await axios.put(`http://localhost:9092/api/comments/${comment.id}`, {
                ...comment,
                content: editedCommentContent
            });
            cancelEditing();
            await fetchComments(taskId);
        } catch (err) {
            console.error("Failed to update comment:", err);
            alert("Failed to update comment");
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:9091/api/tasks', {
                title,
                description,
                userId
            });
            alert("Task added successfully!");
            setTitle('');
            setDescription('');
            setActiveView('show-tasks');
        } catch (err) {
            console.error("Failed to add task:", err);
            alert("Failed to add task");
        }
    };

    const handleFetchFromGoogleCalendar = async () => {
        if (!accessToken || !userId) {
            alert("Access token or user ID missing");
            return;
        }
        try {
            await axios.get(`http://localhost:9091/api/tasks/fetch-google-calendar`, {
                params: { accessToken, userId }
            });
            alert("Fetched tasks from Google Calendar!");
            setActiveView('show-tasks');
        } catch (err) {
            console.error("Failed to fetch from Google Calendar:", err);
            alert("Failed to fetch from Google Calendar");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/';
    };

    return (
        <div className="task-container">

            {/* Navigation Bar */}
            <div className="navbar">
                <h2 className="logo">Smart Task Manager</h2>
                <div className="nav-links">
                    <button
                        className={activeView === 'create-task' ? 'nav-btn active' : 'nav-btn'}
                        onClick={() => setActiveView('create-task')}
                    >
                        Create Task
                    </button>
                    <button
                        className={activeView === 'show-tasks' ? 'nav-btn active' : 'nav-btn'}
                        onClick={() => {
                            setActiveView('show-tasks');
                            fetchTasks();
                        }}
                    >
                        Show Tasks
                    </button>
                    <button
                        className={activeView === 'google-calendar' ? 'nav-btn active' : 'nav-btn'}
                        onClick={() => {
                            setActiveView('google-calendar');
                            handleFetchFromGoogleCalendar();
                        }}
                    >
                        Fetch from Google
                    </button>
                    <button className="nav-btn logout" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>

            {/* Create Task View */}
            {activeView === 'create-task' && (
                <div className="task-form">
                    <h2>Create Task</h2>
                    <form onSubmit={handleAddTask}>
                        <input type="text" placeholder="Task Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                        <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
                        {/* <input type="text" placeholder="User ID" value={userId} disabled /> */}
                        <button type="submit" disabled={loading}>Add Task</button>
                    </form>
                </div>
            )}

            {/* Show Tasks View */}
            {activeView === 'show-tasks' && (
                <div className="task-list">
                    <h3>Tasks</h3>
                    {loading ? (
                        <p>Loading tasks...</p>
                    ) : tasks.length === 0 ? (
                        <p>No tasks found.</p>
                    ) : (
                        tasks.map((task) => (
                            <div key={task.id} className="task-card">
                                <h4>{task.title}</h4>
                                <p>{task.description}</p>
                                <p className="timestamp">
                                    🕒 {new Date(task.createdAt).toLocaleString('en-IN', {
                                    weekday: 'short', year: 'numeric', month: 'short',
                                    day: 'numeric', hour: '2-digit', minute: '2-digit',
                                })}
                                </p>
                                <button onClick={() => toggleComments(task.id)}>
                                    {expandedTasks[task.id] ? 'Hide Comments' : 'Show Comments'}
                                </button>

                                {expandedTasks[task.id] && (
                                    <div className="comments-section">
                                        <div className="comments-list">
                                            {commentsMap[task.id]?.length ? (
                                                commentsMap[task.id].map((comment) => (
                                                    <div key={comment.id} className="comment-item">
                                                        {editingCommentId === comment.id ? (
                                                            <>
                                                                <textarea
                                                                    value={editedCommentContent}
                                                                    onChange={(e) => setEditedCommentContent(e.target.value)}
                                                                    placeholder="Edit your comment..."
                                                                />
                                                                <div className="comment-actions">
                                                                    <button onClick={() => handleUpdateComment(comment, task.id)}>Save</button>
                                                                    <button onClick={cancelEditing}>Cancel</button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <p>{comment.content}</p>
                                                                <p className="timestamp">🗓️ {new Date(comment.createdAt).toLocaleString()}</p>
                                                                <div className="comment-actions">
                                                                    <button onClick={() => startEditing(comment)}>Edit</button>
                                                                    <button onClick={() => handleDeleteComment(comment.id, task.id)}>Delete</button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <p>No comments yet.</p>
                                            )}
                                        </div>
                                        <div className="add-comment">
                                            <input
                                                type="text"
                                                placeholder="Write a comment..."
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                            />
                                            <button onClick={() => handleAddComment(task.id)}>Post</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default TaskManager;
