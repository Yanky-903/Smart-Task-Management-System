package com.example.taskservice.controller;

import com.example.taskservice.model.Task;
import com.example.taskservice.service.GmailService;
import com.example.taskservice.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @Autowired
    private GmailService gmailService;

    // Create a new task manually
    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        Task createdTask = taskService.createTask(task);
        return ResponseEntity.ok(createdTask);
    }

    // Fetch tasks by userId from MongoDB
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Task>> getTasksByUser(@PathVariable String userId) {
        List<Task> tasks = taskService.getTasksByUserId(userId);
        return ResponseEntity.ok(tasks);
    }

    // Fetch tasks from Google Calendar and save them as Task objects in MongoDB
    @GetMapping("/fetch-google-calendar")
    public ResponseEntity<String> fetchFromGoogleCalendar(@RequestParam String accessToken,
                                                          @RequestParam String userId) {
        try {
            gmailService.fetchTasksFromGoogleCalendar(accessToken, userId);
            return ResponseEntity.ok("Fetched tasks from Google Calendar and stored them.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to fetch tasks from Google Calendar");
        }
    }

}
