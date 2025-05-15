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

    useEffect(() => {
        const savedUserId = localStorage.getItem('userId');
        const savedAccessToken = localStorage.getItem('accessToken');

        if (savedUserId) setUserId(savedUserId);
        if (savedAccessToken) setAccessToken(savedAccessToken);
    }, []);

    useEffect(() => {
        if (userId) fetchTasks();
    }, [userId]);

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
            fetchTasks();
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
            await axios.get(`http://localhost:9091/api/tasks/fetch-google-calendar`,  {
                params: { accessToken, userId }
            });
            alert("Fetched tasks from Google Calendar!");
            fetchTasks();
        } catch (err) {
            console.error("Failed to fetch from Google Calendar:", err);
            alert("Failed to fetch from Google Calendar");
        }
    };

    return (
        <div className="task-container">
            <div className="task-form">
                <h2>Create Task</h2>
                <form onSubmit={handleAddTask}>
                    <input
                        type="text"
                        placeholder="Task Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="User ID"
                        value={userId}
                        disabled
                    />
                    <button type="submit" disabled={loading}>Add Task</button>
                </form>

                <div style={{ marginTop: '20px' }}>
                    <h3>Google Calendar Sync</h3>
                    <input
                        type="text"
                        placeholder="Access Token"
                        value={accessToken}
                        disabled
                    />
                    <button onClick={handleFetchFromGoogleCalendar} disabled={loading}>Fetch from Google Calendar</button>
                </div>
            </div>

            <div className="task-list">
                <h3>Tasks for User ID: {userId}</h3>
                {loading ? (
                    <p>Loading tasks...</p>
                ) : tasks.length === 0 ? (
                    <p>No tasks found.</p>
                ) : (
                    tasks.map((task, index) => (
                        <div key={index} className="task-card">
                            <h4>{task.title}</h4>
                            <p>{task.description}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default TaskManager;
