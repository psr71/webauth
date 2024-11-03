package com.webauthN.api.controller;

import com.webauthN.api.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Objects;

//@CrossOrigin(origins = "http://localhost:4200")
@CrossOrigin("*")
@RestController
@RequestMapping("/api/v1/account")
public class AccountController {

    @Autowired
    private AccountService service;

    @GetMapping("/hello")
    public String welcome(){
        return "Welcome";
    }

    @PostMapping("/register")
    public Map<String, Object> options(@RequestBody Map<String, Object> req) {
        return service.getUserOption(req);
    }


    @PostMapping("/finishAuth")
    public Object verification(@RequestBody Map<String, Object> req) {
        return service.userVerification(req);
    }


    @PostMapping("/userOptions")
    public Map<String, Object> userOptions(@RequestBody Map<String, String> req) {
        return service.loginOption(req);
    }


    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, Object> req) {
        return service.loginVerification(req);
    }
}
