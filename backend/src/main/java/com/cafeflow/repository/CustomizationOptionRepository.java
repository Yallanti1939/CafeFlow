package com.cafeflow.repository;

import com.cafeflow.entity.CustomizationOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomizationOptionRepository extends JpaRepository<CustomizationOption, Long> {
}
