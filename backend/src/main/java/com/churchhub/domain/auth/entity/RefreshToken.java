package com.churchhub.domain.auth.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;
import org.springframework.data.redis.core.index.Indexed;

@Getter
@AllArgsConstructor
@RedisHash("refresh_token")
public class RefreshToken {

    @Id
    private String token;

    @Indexed
    private Long userId;

    @TimeToLive
    private Long expiration;
}
