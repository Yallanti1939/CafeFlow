package com.cafeflow.service;

import com.cafeflow.dto.CustomizationGroupDto;
import com.cafeflow.dto.CustomizationOptionDto;
import com.cafeflow.entity.CustomizationGroup;
import com.cafeflow.entity.CustomizationOption;
import com.cafeflow.entity.SelectionType;
import com.cafeflow.repository.CustomizationGroupRepository;
import com.cafeflow.repository.CustomizationOptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomizationService {

    private final CustomizationGroupRepository groupRepository;
    private final CustomizationOptionRepository optionRepository;

    public List<CustomizationGroupDto> getAllCustomizationGroups() {
        return groupRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomizationGroupDto createGroup(CustomizationGroupDto dto) {
        CustomizationGroup group = CustomizationGroup.builder()
                .name(dto.getName())
                .isRequired(dto.getIsRequired() != null ? dto.getIsRequired() : false)
                .selectionType(SelectionType.valueOf(dto.getSelectionType()))
                .build();
        
        CustomizationGroup saved = groupRepository.save(group);
        
        if (dto.getOptions() != null) {
            List<CustomizationOption> options = dto.getOptions().stream()
                    .map(o -> CustomizationOption.builder()
                            .group(saved)
                            .name(o.getName())
                            .price(o.getPrice())
                            .isAvailable(o.getIsAvailable() != null ? o.getIsAvailable() : true)
                            .build())
                    .collect(Collectors.toList());
            optionRepository.saveAll(options);
            saved.setOptions(options);
        }
        
        return mapToDto(saved);
    }

    @Transactional
    public CustomizationGroupDto updateGroup(Long id, CustomizationGroupDto dto) {
        CustomizationGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customization group not found with ID: " + id));
        
        group.setName(dto.getName());
        group.setIsRequired(dto.getIsRequired() != null ? dto.getIsRequired() : group.getIsRequired());
        group.setSelectionType(SelectionType.valueOf(dto.getSelectionType()));
        
        // Save updates
        CustomizationGroup saved = groupRepository.save(group);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteGroup(Long id) {
        CustomizationGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        groupRepository.delete(group);
    }

    @Transactional
    public CustomizationOptionDto addOption(Long groupId, CustomizationOptionDto dto) {
        CustomizationGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        CustomizationOption option = CustomizationOption.builder()
                .group(group)
                .name(dto.getName())
                .price(dto.getPrice())
                .isAvailable(dto.getIsAvailable() != null ? dto.getIsAvailable() : true)
                .build();

        CustomizationOption saved = optionRepository.save(option);
        return mapOptionToDto(saved);
    }

    @Transactional
    public CustomizationOptionDto updateOption(Long optionId, CustomizationOptionDto dto) {
        CustomizationOption option = optionRepository.findById(optionId)
                .orElseThrow(() -> new IllegalArgumentException("Option not found"));

        option.setName(dto.getName());
        option.setPrice(dto.getPrice());
        option.setIsAvailable(dto.getIsAvailable() != null ? dto.getIsAvailable() : option.getIsAvailable());

        CustomizationOption saved = optionRepository.save(option);
        return mapOptionToDto(saved);
    }

    @Transactional
    public void deleteOption(Long optionId) {
        CustomizationOption option = optionRepository.findById(optionId)
                .orElseThrow(() -> new IllegalArgumentException("Option not found"));
        optionRepository.delete(option);
    }

    private CustomizationGroupDto mapToDto(CustomizationGroup g) {
        return CustomizationGroupDto.builder()
                .id(g.getId())
                .name(g.getName())
                .isRequired(g.getIsRequired())
                .selectionType(g.getSelectionType().name())
                .options(g.getOptions() == null ? null : g.getOptions().stream()
                        .map(this::mapOptionToDto)
                        .collect(Collectors.toList()))
                .build();
    }

    private CustomizationOptionDto mapOptionToDto(CustomizationOption o) {
        return CustomizationOptionDto.builder()
                .id(o.getId())
                .name(o.getName())
                .price(o.getPrice())
                .isAvailable(o.getIsAvailable())
                .build();
    }
}
