package com.webauthN.api.service;

import com.webauthN.api.entity.PubKeyCredParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.PreparedStatementCreator;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.sql.*;
import java.util.*;

@Service
public class AccountService {

    @Autowired
    private JdbcTemplate db;


    public Map<String,Object> getUserOption(Map<String,Object> input){
        System.out.println("User Input =>"+input);

        Map<String,String> user = new HashMap<>();
        user.put("id","pawan.rajput@localhost");
        user.put("name","Pawan Rajput");
        user.put("displayName","Pawan Singh Rajput");

        Map<String,String> rp=new HashMap<>();
        rp.put("id","localhost");
        rp.put("name","webauthN");

        String Challenge = UUID.randomUUID().toString();
        String encodedChallenge = Base64.getUrlEncoder().encodeToString(Challenge.getBytes());

        List<PubKeyCredParam> pubKeyCredParams = Arrays.asList(
                new PubKeyCredParam("public-key",-7),
                new PubKeyCredParam("public-key",-257)
        );

        Map<String,String> authenticationSelection = new HashMap<>();
        authenticationSelection.put("authenticatorAttachment","platform");

        List<String> hints = Collections.singletonList("internal");

        Map<String ,Object> result = new HashMap<>();
        result.put("user",user);
        result.put("rp",rp);
        result.put("challenge",encodedChallenge);
        result.put("pubKeyCredParam",pubKeyCredParams);
        result.put("timeout",60000);
        result.put("authenticationSelection",authenticationSelection);
        result.put("attestation","direct");
        result.put("hints",hints);

        return result;
    }

    public Map<String,Object> userVerification(Map<String,Object> input) {
        System.out.println("Verification user input" + input);

        Map<String, Object> userCreds = (Map<String, Object>) input.get("userCreds");
        String credId = (String) userCreds.get("id");

        List<Map<String,Object>> dbUser = db.query(new PreparedStatementCreator() {
            @Override
            public PreparedStatement createPreparedStatement(java.sql.Connection connection) throws SQLException {
                PreparedStatement ps = connection.prepareStatement("select * from usercreds where credId = ?");
                ps.setString(1, credId);
                return ps;
            }
        }, new RowMapper<Map<String, Object>>() {
            @Override
            public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
                Map<String,Object> result = new HashMap<>();
                result.put("name",rs.getString("username"));
                return result;
            }
        });
        if(dbUser.isEmpty()){
            int status = db.update(new PreparedStatementCreator() {
                @Override
                public PreparedStatement createPreparedStatement(Connection con) throws SQLException {
                    PreparedStatement ps =con.prepareStatement("insert into usercreds values(?, ?, ?, ?, ?, ?, ?)");
                    ps.setObject(1, UUID.randomUUID());
                   // ps.setString(1,UUID.randomUUID().toString());
                    ps.setString(2,(String) input.get("name"));
                    ps.setString(3,(String) userCreds.get("id"));
                    ps.setString(4,(String) userCreds.get("publicKey"));
                    List<String> transports = (List<String>) userCreds.get("transports");
                    ps.setString(5,String.join(",",transports));
                    ps.setInt(6,(Integer) userCreds.get("publicKeyAlgorithm"));
                    ps.setString(7,(String) userCreds.get("authenticatorAttachment"));
                    return ps;
                }
            });
            System.out.println("status of update is " + status);
            Map<String, Object> response = new HashMap<>();
            response.put("username", input.get("name"));
            response.put("login", "complete");
            return response;
        } else {
            Map<String, Object> response = new HashMap<>();
            response.put("username", input.get("name"));
            response.put("login", "ready_exists");
            return response;
        }
    }
    public Map<String,Object> loginOption(Map<String,String > input){
        String username = input.get("username");
        if(username == null ){
            throw  new IllegalArgumentException("Username cannot be null");
        }
        List<Map<String,Object>> userList=db.query("select * from usercreds where username= '" + username + "'", new RowMapper<Map<String, Object>>() {
            @Override
            public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
                System.out.println("idx :"+ rowNum);
                Map<String,Object> result = new HashMap<>();
                result.put("id",rs.getString("id"));
                result.put("name",rs.getString("username"));
                result.put("transports",rs.getString("transports"));
                result.put("credId",rs.getString("credId"));
                result.put("rp","localhost");
                return result;
            }
        });
        System.out.println(userList);
        String challenge = UUID.randomUUID().toString();

        Map<String,Object> result= new HashMap<>();
        result.put("users",userList);
        result.put("challenge",challenge);
        return result;
    }

public Map<String, Object> loginVerification(Map<String, Object> input) {
    System.out.println("input: " + input);

    Map<String, Object> creds = (Map<String, Object>) input.get("userCreds");
    String userHandleBase64 = (String) creds.get("userHandle");
    String username = new String(Base64.getUrlDecoder().decode(userHandleBase64));
    String credId = (String) creds.get("id");

    System.out.println("Decoded username: " + username);
    System.out.println("Credential ID: " + credId);

    List<Map<String, Object>> userCred = db.query(
            "select * from usercreds where credId = ? and username = ?",
            new Object[]{credId, username},
            new RowMapper<Map<String, Object>>() {
                @Override
                public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
                    System.out.println("idx : " + rowNum);
                    Map<String, Object> result = new HashMap<>();
                    result.put("id", rs.getString("id"));
                    result.put("credId", rs.getString("credId"));
                    result.put("username", rs.getString("username"));
                    result.put("publicKey", rs.getString("publicKey"));
                    result.put("publicKeyAlgorithm", rs.getString("pkalgo"));
                    return result;
                }
            }
    );

    System.out.println("User credentials from DB: " + userCred);

    Map<String, Object> dbcred = userCred.stream()
            .filter(cred -> credId.equals(cred.get("credId")))
            .findFirst()
            .orElse(null);

    if (dbcred == null) {
        System.out.println("dbcred is null");
    } else {
        System.out.println("dbcred: " + dbcred);
    }

    Map<String, Object> response = new HashMap<>();
    if (dbcred != null && credId.equals(dbcred.get("credId"))) {
        response.put("login", "complete");
        response.put("username", dbcred.get("username"));
    } else {
        response.put("login", "not");
        response.put("username", input.get("name"));
    }

    return response;
}
}
