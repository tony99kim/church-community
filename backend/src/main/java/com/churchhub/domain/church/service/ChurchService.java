package com.churchhub.domain.church.service;

import com.churchhub.domain.church.dto.ChurchDto;
import com.churchhub.domain.church.entity.Church;
import com.churchhub.domain.church.repository.ChurchRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChurchService {

    private final ChurchRepository churchRepository;

    public List<ChurchDto.Response> getChurches() {
        return churchRepository.findAllByVisibleTrueOrderByNameAsc()
                .stream().map(ChurchDto.Response::from).toList();
    }

    public ChurchDto.Response getChurch(Long id) {
        Church church = churchRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHURCH_NOT_FOUND));
        return ChurchDto.Response.from(church);
    }

    @Transactional
    public ChurchDto.Response createChurch(ChurchDto.CreateRequest req) {
        Church church = Church.builder()
                .name(req.getName())
                .address(req.getAddress())
                .sundayServiceTime(req.getSundayServiceTime())
                .hasYouthGroup(req.isHasYouthGroup())
                .contactInfo(req.getContactInfo())
                .introduction(req.getIntroduction())
                .websiteUrl(req.getWebsiteUrl())
                .instagramUrl(req.getInstagramUrl())
                .build();
        return ChurchDto.Response.from(churchRepository.save(church));
    }

    @Transactional
    public ChurchDto.Response updateChurch(Long id, ChurchDto.UpdateRequest req) {
        Church church = churchRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHURCH_NOT_FOUND));
        church.update(req.getName(), req.getAddress(), req.getSundayServiceTime(),
                req.isHasYouthGroup(), req.getContactInfo(), req.getIntroduction(),
                req.getWebsiteUrl(), req.getInstagramUrl(), req.isVisible());
        return ChurchDto.Response.from(church);
    }

    @Transactional
    public void deleteChurch(Long id) {
        if (!churchRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.CHURCH_NOT_FOUND);
        }
        churchRepository.deleteById(id);
    }
}
