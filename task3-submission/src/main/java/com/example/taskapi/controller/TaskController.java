package com.example.taskapi.controller;

import com.example.taskapi.model.Task;
import com.example.taskapi.model.TaskExecution;
import com.example.taskapi.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;


import org.springframework.web.bind.annotation.CrossOrigin;


@RestController
@RequestMapping("/tasks")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    // GET all tasks OR by id
    @GetMapping
    public ResponseEntity<?> getTasks(@RequestParam(required = false) String id) {
        if (id == null) {
            return ResponseEntity.ok(taskRepository.findAll());
        } else {
            Optional<Task> task = taskRepository.findById(id);
            return task.<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        }
    }

    // PUT create/update a task
    @PutMapping
    public ResponseEntity<?> putTask(@RequestBody Task task) {
        if (!isCommandSafe(task.getCommand())) {
            return ResponseEntity.badRequest().body("Unsafe command");
        }
        return ResponseEntity.ok(taskRepository.save(task));
    }

    // DELETE by id
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable String id) {
        if (!taskRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        taskRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // GET search by name substring
    @GetMapping("/search")
    public ResponseEntity<?> searchTasks(@RequestParam String name) {
        List<Task> tasks = taskRepository.findByNameContainingIgnoreCase(name);
        if (tasks.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(tasks);
    }

    // PUT execution for a task
    @PutMapping("/{id}/executions")
    public ResponseEntity<?> executeTask(@PathVariable String id) {
        Optional<Task> optTask = taskRepository.findById(id);
        if (optTask.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Task task = optTask.get();
        if (!isCommandSafe(task.getCommand())) {
            return ResponseEntity.badRequest().body("Unsafe command");
        }

        Date start = Date.from(Instant.now());
        String output;
        try {
            String[] cmd;
            if (System.getProperty("os.name").toLowerCase().contains("win")) {
                cmd = new String[]{"cmd.exe", "/c", task.getCommand()};
            } else {
                cmd = new String[]{"/bin/bash", "-c", task.getCommand()};
            }
            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(true);
            Process p = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
            output = reader.lines().collect(Collectors.joining("\n"));
            p.waitFor();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Execution failed: " + e.getMessage());
        }
        Date end = Date.from(Instant.now());

        TaskExecution exec = new TaskExecution(start, end, output);
        task.getTaskExecutions().add(exec);
        taskRepository.save(task);

        return ResponseEntity.ok(exec);
    }

    // simple validator
    private boolean isCommandSafe(String cmd) {
        if (cmd == null || cmd.isBlank()) return false;
        Pattern dangerous = Pattern.compile("[;&|`$><]");
        return !dangerous.matcher(cmd).find() && !cmd.contains("$(");
    }
}