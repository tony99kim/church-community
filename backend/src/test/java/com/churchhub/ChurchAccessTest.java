package com.churchhub;

import com.churchhub.domain.church.entity.Church;
import com.churchhub.domain.church.repository.ChurchRepository;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.entity.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ChurchAccessTest extends IntegrationTestBase {

    @Autowired ChurchRepository churchRepository;

    private Church church() {
        return churchRepository.save(Church.builder()
                .name("교회" + UUID.randomUUID().toString().substring(0, 6))
                .address("서울")
                .build());
    }

    private User member(UserRole role, Church church) {
        User user = createUser(role);
        user.assignChurch(church);
        return userRepository.save(user);
    }

    private String body(String name) {
        return "{\"name\":\"" + name + "\",\"address\":\"서울\",\"visible\":true}";
    }

    @Test
    void 목회자는_교회_목록을_조회함() throws Exception {
        User pastor = member(UserRole.PASTOR, church());
        mockMvc.perform(get("/api/v1/admin/churches").cookie(cookie(login(pastor), "access_token")))
                .andExpect(status().isOk());
    }

    @Test
    void 전도사는_자기_교회를_수정함() throws Exception {
        Church mine = church();
        User evangelist = member(UserRole.EVANGELIST, mine);
        mockMvc.perform(put("/api/v1/admin/churches/" + mine.getId())
                        .cookie(cookie(login(evangelist), "access_token"))
                        .contentType(MediaType.APPLICATION_JSON).content(body("새이름")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("새이름"));
    }

    @Test
    void 교회_담당자는_다른_교회를_수정할_수_없음() throws Exception {
        User manager = member(UserRole.CHURCH_MANAGER, church());
        Church other = church();
        mockMvc.perform(put("/api/v1/admin/churches/" + other.getId())
                        .cookie(cookie(login(manager), "access_token"))
                        .contentType(MediaType.APPLICATION_JSON).content(body("변경")))
                .andExpect(status().isForbidden());
    }

    @Test
    void 최고관리자는_모든_교회를_수정함() throws Exception {
        User admin = createUser(UserRole.SUPER_ADMIN);
        Church any = church();
        mockMvc.perform(put("/api/v1/admin/churches/" + any.getId())
                        .cookie(cookie(login(admin), "access_token"))
                        .contentType(MediaType.APPLICATION_JSON).content(body("변경")))
                .andExpect(status().isOk());
    }

    @Test
    void 일반_회원은_교회_관리_API_403() throws Exception {
        User user = createUser(UserRole.USER);
        mockMvc.perform(get("/api/v1/admin/churches").cookie(cookie(login(user), "access_token")))
                .andExpect(status().isForbidden());
    }
}
