package com.churchhub;

import com.churchhub.domain.space.entity.Space;
import com.churchhub.domain.space.entity.SpaceBlock;
import com.churchhub.domain.space.repository.SpaceBlockRepository;
import com.churchhub.domain.space.repository.SpaceRepository;
import com.churchhub.domain.user.entity.UserRole;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SpaceRentalTest extends IntegrationTestBase {

    @Autowired SpaceRepository spaceRepository;
    @Autowired SpaceBlockRepository spaceBlockRepository;

    Space space;
    Cookie access;
    LocalDate day = LocalDate.now(ZoneId.of("Asia/Seoul")).plusDays(7);

    @BeforeEach
    void setUp() throws Exception {
        space = spaceRepository.save(Space.builder().name("세미나실")
                .openTime(LocalTime.of(9, 0)).closeTime(LocalTime.of(22, 0)).slotMinutes(60).build());
        spaceBlockRepository.save(SpaceBlock.builder().space(space).reason("주일 예배").recurring(false)
                .blockDate(day).startTime(LocalTime.of(10, 0)).endTime(LocalTime.of(12, 0)).build());
        access = cookie(login(createUser(UserRole.USER)), "access_token");
    }

    private ResultActions apply(LocalDateTime start, LocalDateTime end) throws Exception {
        return mockMvc.perform(post("/api/v1/spaces/" + space.getId() + "/rentals").cookie(access)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"startDateTime\":\"" + start + "\",\"endDateTime\":\"" + end
                        + "\",\"purpose\":\"모임\",\"contactPhone\":\"010-0000-0000\"}"));
    }

    @Test
    void 정상_신청() throws Exception {
        apply(day.atTime(14, 0), day.atTime(15, 0)).andExpect(status().isOk());
    }

    @Test
    void 막아둔_시간은_거부() throws Exception {
        apply(day.atTime(11, 0), day.atTime(13, 0))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("SPACE_SLOT_BLOCKED"));
    }

    @Test
    void 시작이_종료보다_늦거나_과거면_거부() throws Exception {
        apply(day.atTime(15, 0), day.atTime(14, 0)).andExpect(status().isBadRequest());
        apply(day.minusDays(30).atTime(14, 0), day.minusDays(30).atTime(15, 0)).andExpect(status().isBadRequest());
    }

    @Test
    void 겹치는_시간은_거부() throws Exception {
        apply(day.atTime(16, 0), day.atTime(18, 0)).andExpect(status().isOk());
        apply(day.atTime(17, 0), day.atTime(19, 0))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("SPACE_SLOT_TAKEN"));
    }
}
