package com.zidio.hr.nexus.controller;

import com.zidio.hr.nexus.dto.AttritionRiskResponse;
import com.zidio.hr.nexus.service.AttritionRiskService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai-insights")
public class AttritionRiskController {

    private final AttritionRiskService attritionRiskService;

    public AttritionRiskController(
            AttritionRiskService attritionRiskService) {
        this.attritionRiskService = attritionRiskService;
    }

    @GetMapping("/attrition-risk")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<AttritionRiskResponse> getAttritionRisk() {

        return ResponseEntity.ok(
                attritionRiskService.analyzeAttritionRisk()
        );
    }
}

