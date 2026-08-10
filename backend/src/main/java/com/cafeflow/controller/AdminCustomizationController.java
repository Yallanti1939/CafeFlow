package com.cafeflow.controller;

import com.cafeflow.dto.CustomizationGroupDto;
import com.cafeflow.dto.CustomizationOptionDto;
import com.cafeflow.service.CustomizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/customizations")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER')")
public class AdminCustomizationController {

    private final CustomizationService customizationService;

    @GetMapping
    public ResponseEntity<List<CustomizationGroupDto>> getAllGroups() {
        return ResponseEntity.ok(customizationService.getAllCustomizationGroups());
    }

    @PostMapping
    public ResponseEntity<CustomizationGroupDto> createGroup(@Valid @RequestBody CustomizationGroupDto dto) {
        return ResponseEntity.ok(customizationService.createGroup(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomizationGroupDto> updateGroup(@PathVariable("id") Long id, @Valid @RequestBody CustomizationGroupDto dto) {
        return ResponseEntity.ok(customizationService.updateGroup(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable("id") Long id) {
        customizationService.deleteGroup(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{groupId}/options")
    public ResponseEntity<CustomizationOptionDto> addOption(@PathVariable("groupId") Long groupId, @Valid @RequestBody CustomizationOptionDto dto) {
        return ResponseEntity.ok(customizationService.addOption(groupId, dto));
    }

    @PutMapping("/options/{optionId}")
    public ResponseEntity<CustomizationOptionDto> updateOption(@PathVariable("optionId") Long optionId, @Valid @RequestBody CustomizationOptionDto dto) {
        return ResponseEntity.ok(customizationService.updateOption(optionId, dto));
    }

    @DeleteMapping("/options/{optionId}")
    public ResponseEntity<Void> deleteOption(@PathVariable("optionId") Long optionId) {
        customizationService.deleteOption(optionId);
        return ResponseEntity.ok().build();
    }
}
