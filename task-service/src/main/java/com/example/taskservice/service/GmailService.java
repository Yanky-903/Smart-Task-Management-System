package com.example.taskservice.service;

import com.example.taskservice.model.Task;
import com.example.taskservice.repository.TaskRepository;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class GmailService {

    @Autowired
    private TaskRepository taskRepository;

    private static final String CALENDAR_API_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

    public void fetchTasksFromGoogleCalendar(String accessToken, String userId) throws Exception {
        RestTemplate restTemplate = new RestTemplate();

        try {
            // Prepare headers with Bearer token
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);  // Recommended way
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            HttpEntity<String> entity = new HttpEntity<>(headers);

            String url = CALENDAR_API_URL;

            System.out.println("Sending request to Google Calendar API: " + url);

            ResponseEntity<String> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            String response = responseEntity.getBody();

            System.out.println("Google Calendar API Response:");
            System.out.println(response);

            if (response == null) {
                throw new Exception("Empty response from Google Calendar API");
            }

            JsonObject calendarJson = JsonParser.parseString(response).getAsJsonObject();
            JsonArray events = calendarJson.getAsJsonArray("items");

            if (events == null || events.size() == 0) {
                System.out.println("No events found in Google Calendar.");
                return;
            }

            for (int i = 0; i < events.size(); i++) {
                JsonObject event = events.get(i).getAsJsonObject();

                // Get Google Calendar event ID to prevent duplicates
                String googleEventId = event.has("id") ? event.get("id").getAsString() : null;

                if (googleEventId == null) {
                    System.out.println("Skipping event without ID.");
                    continue;
                }

                // Check if a task with this googleEventId already exists
                Optional<Task> existingTask = taskRepository.findByGoogleEventId(googleEventId);
                if (existingTask.isPresent()) {
                    // Skip or update existing task if you want
                    continue; // skipping duplicate
                }

                String title = event.has("summary") ? event.get("summary").getAsString() : "Untitled Event";
                String description = event.has("description") ? event.get("description").getAsString() : "No description";

                Task task = new Task();
                task.setGoogleEventId(googleEventId);  // set unique Google event ID
                task.setTitle(title);
                task.setDescription(description);
                task.setStatus("Pending");
                task.setUserId(userId);
                task.setCreatedAt(new Date());

                taskRepository.save(task);
            }
        } catch (RestClientException e) {
            System.err.println("HTTP error when calling Google Calendar API: " + e.getMessage());
            throw new Exception("Failed to fetch events from Google Calendar API", e);
        } catch (Exception e) {
            System.err.println("Error processing Google Calendar response: " + e.getMessage());
            throw e;
        }
    }
}
