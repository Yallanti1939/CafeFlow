package com.cafeflow.service;

import com.cafeflow.entity.Order;
import com.cafeflow.entity.OrderItem;
import com.cafeflow.entity.OrderItemCustomization;
import com.cafeflow.entity.Invoice;
import com.cafeflow.repository.OrderRepository;
import com.cafeflow.repository.InvoiceRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final OrderRepository orderRepository;

    @Value("${cafeflow.upload.dir}")
    private String uploadDir;

    @Transactional
    public Invoice generateInvoice(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        if (order.getPaymentStatus() != com.cafeflow.entity.PaymentStatus.PAID) {
            throw new IllegalStateException("Cannot generate invoice for unpaid orders.");
        }

        // Check if invoice already exists
        Optional<Invoice> existing = invoiceRepository.findByOrderId(orderId);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Fetch invoice serial
        Long seqVal = getInvoiceSeq();
        String invoiceNumber = String.format("INV-%s-%05d", 
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")), seqVal);

        String pdfFilename = invoiceNumber + ".pdf";
        String relativePath = "invoices/" + pdfFilename;
        String absolutePath = uploadDir + relativePath;

        // Ensure directories exist
        try {
            Files.createDirectories(Paths.get(uploadDir + "invoices"));
        } catch (IOException e) {
            log.error("Failed to create invoices folder", e);
        }

        // Create PDF
        createPdfInvoice(order, invoiceNumber, absolutePath);

        Invoice invoice = Invoice.builder()
                .order(order)
                .invoiceNumber(invoiceNumber)
                .pdfPath("/uploads/products/" + relativePath)
                .build();

        return invoiceRepository.save(invoice);
    }

    private void createPdfInvoice(Order order, String invoiceNumber, String destPath) {
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        try {
            PdfWriter.getInstance(document, new FileOutputStream(destPath));
            document.open();

            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Font.BOLD, java.awt.Color.DARK_GRAY);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD, java.awt.Color.WHITE);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Font.NORMAL, java.awt.Color.BLACK);
            Font bodyBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD, java.awt.Color.BLACK);

            // Title
            Paragraph title = new Paragraph("☕ CafeFlow Invoice", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Info Table
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(20);

            PdfPCell cellLeft = new PdfPCell(new Paragraph(
                    "Invoice #: " + invoiceNumber + "\n" +
                    "Date: " + order.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + "\n" +
                    "Order ID: " + order.getOrderIdFormatted(), bodyFont));
            cellLeft.setBorder(Rectangle.NO_BORDER);
            infoTable.addCell(cellLeft);

            PdfPCell cellRight = new PdfPCell(new Paragraph(
                    "CafeFlow Digital Cafe\n" +
                    "Customer: " + order.getCustomer().getMobileNumber() + "\n" +
                    "Status: PAID", bodyFont));
            cellRight.setHorizontalAlignment(Element.ALIGN_RIGHT);
            cellRight.setBorder(Rectangle.NO_BORDER);
            infoTable.addCell(cellRight);

            document.add(infoTable);

            // Items Table
            PdfPTable itemsTable = new PdfPTable(new float[]{3f, 1f, 1f, 1f});
            itemsTable.setWidthPercentage(100);
            itemsTable.setSpacingAfter(20);

            // Table Headers
            String[] headers = {"Item & Customizations", "Qty", "Unit Price", "Total Price"};
            for (String header : headers) {
                PdfPCell headerCell = new PdfPCell(new Paragraph(header, headerFont));
                headerCell.setBackgroundColor(java.awt.Color.DARK_GRAY);
                headerCell.setPadding(6);
                itemsTable.addCell(headerCell);
            }

            for (OrderItem item : order.getItems()) {
                // Compile item title with customizations
                StringBuilder itemDetails = new StringBuilder(item.getProductName());
                if (item.getCustomizations() != null && !item.getCustomizations().isEmpty()) {
                    itemDetails.append("\n  Customs: ");
                    String customsStr = item.getCustomizations().stream()
                            .map(c -> c.getCustomizationOptionName() + " (+₹" + c.getAdditionalPrice() + ")")
                            .collect(Collectors.joining(", "));
                    itemDetails.append(customsStr);
                }

                PdfPCell nameCell = new PdfPCell(new Paragraph(itemDetails.toString(), bodyFont));
                nameCell.setPadding(6);
                itemsTable.addCell(nameCell);

                PdfPCell qtyCell = new PdfPCell(new Paragraph(item.getQuantity().toString(), bodyFont));
                qtyCell.setPadding(6);
                qtyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                itemsTable.addCell(qtyCell);

                PdfPCell priceCell = new PdfPCell(new Paragraph("₹" + item.getUnitFinalPrice().toString(), bodyFont));
                priceCell.setPadding(6);
                priceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                itemsTable.addCell(priceCell);

                PdfPCell totalCell = new PdfPCell(new Paragraph("₹" + item.getTotalPrice().toString(), bodyFont));
                totalCell.setPadding(6);
                totalCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                itemsTable.addCell(totalCell);
            }

            document.add(itemsTable);

            // Summary Table
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(40);
            summaryTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
            summaryTable.setSpacingAfter(20);

            summaryTable.addCell(new PdfPCell(new Paragraph("Subtotal:", bodyFont)));
            PdfPCell cellSub = new PdfPCell(new Paragraph("₹" + order.getSubtotal().toString(), bodyFont));
            cellSub.setHorizontalAlignment(Element.ALIGN_RIGHT);
            summaryTable.addCell(cellSub);

            summaryTable.addCell(new PdfPCell(new Paragraph("Tax (5%):", bodyFont)));
            PdfPCell cellTax = new PdfPCell(new Paragraph("₹" + order.getTax().toString(), bodyFont));
            cellTax.setHorizontalAlignment(Element.ALIGN_RIGHT);
            summaryTable.addCell(cellTax);

            summaryTable.addCell(new PdfPCell(new Paragraph("Discount:", bodyFont)));
            PdfPCell cellDisc = new PdfPCell(new Paragraph("-₹" + order.getDiscount().toString(), bodyFont));
            cellDisc.setHorizontalAlignment(Element.ALIGN_RIGHT);
            summaryTable.addCell(cellDisc);

            PdfPCell totalLabel = new PdfPCell(new Paragraph("Total:", bodyBold));
            totalLabel.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
            summaryTable.addCell(totalLabel);

            PdfPCell cellTot = new PdfPCell(new Paragraph("₹" + order.getFinalAmount().toString(), bodyBold));
            cellTot.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
            cellTot.setHorizontalAlignment(Element.ALIGN_RIGHT);
            summaryTable.addCell(cellTot);

            document.add(summaryTable);

            // Footer Note
            Paragraph footer = new Paragraph("Thank you for choosing CafeFlow!\nHave a wonderful day!", bodyFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

        } catch (DocumentException | IOException de) {
            log.error("Failed to compile pdf invoice for order " + order.getOrderIdFormatted(), de);
        } finally {
            document.close();
        }
    }

    private Object entityManagerGetSeq() {
        // Safe sequence fetch helper
        try {
            return orderRepository.getClass().getClassLoader()
                    .loadClass("jakarta.persistence.EntityManager");
        } catch (Exception e) {
            // Raw JPA sequence fallback
            return orderRepository.hashCode(); // Mocking sequence fallback if needed, but since it is managed by OrderService native queries, we draw from invoice_number_seq instead!
        }
    }

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    private Long getInvoiceSeq() {
        return ((Number) entityManager.createNativeQuery("SELECT nextval('invoice_number_seq')").getSingleResult()).longValue();
    }
}
