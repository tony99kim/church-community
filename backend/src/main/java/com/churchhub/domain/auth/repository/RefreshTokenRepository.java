package com.churchhub.domain.auth.repository;

import com.churchhub.domain.auth.entity.RefreshToken;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface RefreshTokenRepository extends CrudRepository<RefreshToken, String> {
    List<RefreshToken> findAllByUserId(Long userId);
    void deleteAllByUserId(Long userId);
}
