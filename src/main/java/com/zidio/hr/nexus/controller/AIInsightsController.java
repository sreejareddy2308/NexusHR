
package com.zidio.hr.nexus.controller;

import com.zidio.hr.nexus.dto.AIInsightsResponse;
import com.zidio.hr.nexus.service.AIInsightsService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai-insights")
@CrossOrigin(origins = "http://localhost:5173")
public class AIInsightsController {

    private final AIInsightsService aiInsightsService;

    public AIInsightsController(
            AIInsightsService aiInsightsService) {
        this.aiInsightsService = aiInsightsService;
    }

    // Admin and HR Manager can access AI insights
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<AIInsightsResponse> getDashboardInsights() {

        AIInsightsResponse insights =
                aiInsightsService.getWorkforceInsights();

        return ResponseEntity.ok(insights);
    }
}

