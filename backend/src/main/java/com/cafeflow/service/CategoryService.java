package com.cafeflow.service;

import com.cafeflow.dto.CategoryDto;
import com.cafeflow.entity.Category;
import com.cafeflow.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<CategoryDto> getVisibleCategories() {
        return categoryRepository.findByIsVisibleTrueOrderByDisplayOrderAsc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryDto createCategory(CategoryDto dto) {
        Category category = Category.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0)
                .isVisible(dto.getIsVisible() != null ? dto.getIsVisible() : true)
                .build();
        return mapToDto(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDto updateCategory(Long id, CategoryDto dto) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + id));
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        category.setImageUrl(dto.getImageUrl());
        category.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : category.getDisplayOrder());
        category.setIsVisible(dto.getIsVisible() != null ? dto.getIsVisible() : category.getIsVisible());
        return mapToDto(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + id));
        categoryRepository.delete(category);
    }

    private CategoryDto mapToDto(Category entity) {
        return CategoryDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .imageUrl(entity.getImageUrl())
                .displayOrder(entity.getDisplayOrder())
                .isVisible(entity.getIsVisible())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
