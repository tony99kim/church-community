package com.churchhub;

import com.churchhub.domain.auth.repository.RefreshTokenRepository;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.entity.UserRole;
import com.churchhub.domain.user.entity.UserStatus;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthSecurityTest extends IntegrationTestBase {

    @Autowired RefreshTokenRepository refreshTokenRepository;

    @Test
    void 로그인_쿠키는_SameSite_Lax() throws Exception {
        User user = createUser(UserRole.USER);
        String setCookies = String.join("\n", mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + user.getEmail() + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andReturn().getResponse().getHeaders(HttpHeaders.SET_COOKIE));
        assertThat(setCookies).contains("access_token=").contains("SameSite=Lax").doesNotContain("SameSite=None");
    }

    @Test
    void 정지된_회원은_기존_액세스_토큰으로_인증되지_않음() throws Exception {
        User user = createUser(UserRole.USER);
        Cookie access = cookie(login(user), "access_token");
        mockMvc.perform(get("/api/v1/users/me").cookie(access)).andExpect(status().isOk());

        user.changeStatus(UserStatus.SUSPENDED);
        userRepository.save(user);

        mockMvc.perform(get("/api/v1/users/me").cookie(access)).andExpect(status().isUnauthorized());
    }

    @Test
    void 정지된_회원은_토큰_재발급이_거부되고_refresh_토큰이_삭제됨() throws Exception {
        User user = createUser(UserRole.USER);
        Cookie refresh = cookie(login(user), "refresh_token");

        user.changeStatus(UserStatus.SUSPENDED);
        userRepository.save(user);

        mockMvc.perform(post("/api/v1/auth/refresh").cookie(refresh))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCOUNT_SUSPENDED"));
        assertThat(refreshTokenRepository.findAll()).noneMatch(t -> t.getUserId().equals(user.getId()));
    }

    @Test
    void 관리자가_정지하면_refresh_토큰이_모두_삭제됨() throws Exception {
        User admin = createUser(UserRole.SUPER_ADMIN);
        User user = createUser(UserRole.USER);
        login(user);
        Cookie adminAccess = cookie(login(admin), "access_token");

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .put("/api/v1/admin/users/" + user.getId() + "/status")
                        .cookie(adminAccess)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SUSPENDED\"}"))
                .andExpect(status().isOk());
        assertThat(refreshTokenRepository.findAll()).noneMatch(t -> t.getUserId().equals(user.getId()));
    }

    @Test
    void 소셜_로그인_코드는_교환하면_쿠키를_설정함() throws Exception {
        User user = createUser(UserRole.USER);
        when(valueOps.getAndDelete("oauth:code:abc")).thenReturn(String.valueOf(user.getId()));

        String setCookies = String.join("\n", mockMvc.perform(post("/api/v1/auth/oauth/exchange")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"code\":\"abc\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getHeaders(HttpHeaders.SET_COOKIE));
        assertThat(setCookies).contains("access_token=").contains("refresh_token=");
    }

    @Test
    void 잘못된_소셜_로그인_코드는_401() throws Exception {
        when(valueOps.getAndDelete(anyString())).thenReturn(null);
        mockMvc.perform(post("/api/v1/auth/oauth/exchange")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"code\":\"nope\"}"))
                .andExpect(status().isUnauthorized());
    }
}
