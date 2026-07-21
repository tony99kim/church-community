package com.churchhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class ChurchHubApplication {
    public static void main(String[] args) {
        SpringApplication.run(ChurchHubApplication.class, args);
    }
}
