package com.cafeflow.controller;

import com.cafeflow.entity.Invoice;
import com.cafeflow.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.io.File;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AdminInvoiceController {

    private final InvoiceRepository invoiceRepository;
    private final com.cafeflow.service.InvoiceService invoiceService;
    
    @Value("${cafeflow.upload.dir}")
    private String uploadDir;

    @GetMapping("/admin/invoices")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> getAllInvoices() {
        List<Map<String, Object>> invoices = invoiceRepository.findAll().stream()
                .map(inv -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", inv.getId());
                    map.put("invoiceNumber", inv.getInvoiceNumber());
                    map.put("orderId", inv.getOrder().getId());
                    map.put("orderIdFormatted", inv.getOrder().getOrderIdFormatted());
                    map.put("customerMobile", inv.getOrder().getCustomer().getMobileNumber());
                    map.put("finalAmount", inv.getOrder().getFinalAmount());
                    map.put("generatedAt", inv.getGeneratedAt());
                    map.put("pdfPath", inv.getPdfPath());
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/customer/invoices/{orderId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> getCustomerInvoice(@PathVariable("orderId") Long orderId) {
        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElse(null);
        if (invoice == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Invoice not generated yet. Payments might be pending.");
        }
        
        Map<String, Object> map = new HashMap<>();
        map.put("id", invoice.getId());
        map.put("invoiceNumber", invoice.getInvoiceNumber());
        map.put("pdfPath", invoice.getPdfPath());
        map.put("generatedAt", invoice.getGeneratedAt());
        return ResponseEntity.ok(map);
    }

    @GetMapping("/invoices/download/{invoiceNumber}")
    public ResponseEntity<?> downloadInvoicePdf(@PathVariable("invoiceNumber") String invoiceNumber) {
        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));

        String filename = invoiceNumber + ".pdf";
        File file = Paths.get(uploadDir, "invoices", filename).toFile();

        // Always re-generate PDF on download to ensure logo and colorful UI layout are present
        try {
            java.nio.file.Files.createDirectories(Paths.get(uploadDir, "invoices"));
            invoiceService.createPdfInvoice(invoice.getOrder(), invoiceNumber, file.getAbsolutePath());
        } catch (Exception e) {
            // Fallback check
        }

        if (!file.exists()) {
            file = new File("uploads/products/invoices/" + filename);
        }

        if (!file.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Physical PDF receipt file not found.");
        }

        Resource resource = new FileSystemResource(file);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }
}
