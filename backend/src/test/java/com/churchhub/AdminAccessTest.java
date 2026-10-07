package com.churchhub;

import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.entity.UserRole;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminAccessTest extends IntegrationTestBase {

    @Test
    void 일반_회원은_관리자_API_403() throws Exception {
        User user = createUser(UserRole.USER);
        mockMvc.perform(get("/api/v1/admin/pending-counts").cookie(cookie(login(user), "access_token")))
                .andExpect(status().isForbidden());
    }

    @Test
    void 목회자는_대기_건수를_조회함() throws Exception {
        User pastor = createUser(UserRole.PASTOR);
        mockMvc.perform(get("/api/v1/admin/pending-counts").cookie(cookie(login(pastor), "access_token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.spaceRentals").isNumber())
                .andExpect(jsonPath("$.data.faithQuestions").isNumber());
    }

    @Test
    void 교회_담당자는_신앙_QA_관리_API_403() throws Exception {
        User manager = createUser(UserRole.CHURCH_MANAGER);
        mockMvc.perform(get("/api/v1/faith/admin/questions").cookie(cookie(login(manager), "access_token")))
                .andExpect(status().isForbidden());
    }

    @Test
    void 비로그인으로_내_질문_조회시_500이_아니라_401() throws Exception {
        mockMvc.perform(get("/api/v1/faith/questions/my")).andExpect(status().isUnauthorized());
    }

    @Test
    void 일반_회원이_최고관리자_API를_부르면_500이_아니라_403() throws Exception {
        User user = createUser(UserRole.USER);
        mockMvc.perform(get("/api/v1/faith/admin/prayers").cookie(cookie(login(user), "access_token")))
                .andExpect(status().isForbidden());
    }
}
