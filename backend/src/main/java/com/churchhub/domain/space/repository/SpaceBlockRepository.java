package com.churchhub.domain.space.repository;

import com.churchhub.domain.space.entity.SpaceBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpaceBlockRepository extends JpaRepository<SpaceBlock, Long> {
    List<SpaceBlock> findAllBySpaceId(Long spaceId);
}
