package com.churchhub.domain.welcome.service;

import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.repository.UserRepository;
import com.churchhub.domain.welcome.dto.WelcomeKitDto;
import com.churchhub.domain.welcome.entity.WelcomeKit;
import com.churchhub.domain.welcome.repository.WelcomeKitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WelcomeKitService {

    private final WelcomeKitRepository welcomeKitRepository;
    private final UserRepository userRepository;

    @Transactional
    public WelcomeKitDto.Response apply(WelcomeKitDto.Request req, Long userId) {
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        WelcomeKit kit = WelcomeKit.builder()
                .user(user).name(req.getName()).phone(req.getPhone())
                .address(req.getAddress()).message(req.getMessage()).build();
        return WelcomeKitDto.Response.from(welcomeKitRepository.save(kit));
    }

    public List<WelcomeKitDto.Response> getAll() {
        return welcomeKitRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(WelcomeKitDto.Response::from).toList();
    }

    public List<WelcomeKitDto.Response> getMyKits(Long userId) {
        return welcomeKitRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(WelcomeKitDto.Response::from).toList();
    }

    @Transactional
    public WelcomeKitDto.Response markProcessed(Long id) {
        WelcomeKit kit = welcomeKitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));
        kit.markProcessed();
        return WelcomeKitDto.Response.from(kit);
    }

    @Transactional
    public WelcomeKitDto.Response sendAdminMessage(Long id, String adminMessage) {
        WelcomeKit kit = welcomeKitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));
        kit.setAdminMessage(adminMessage);
        kit.markProcessed();
        return WelcomeKitDto.Response.from(kit);
    }
}
