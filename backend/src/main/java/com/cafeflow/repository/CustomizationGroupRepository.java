package com.cafeflow.repository;

import com.cafeflow.entity.CustomizationGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomizationGroupRepository extends JpaRepository<CustomizationGroup, Long> {
}
