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
import java.awt.BasicStroke;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
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

    private String ensureLogoExists() {
        String logoPath = uploadDir + "cafeflow_logo.png";
        try {
            Files.createDirectories(Paths.get(uploadDir));
            int width = 400;
            int height = 120;
            BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g2d = image.createGraphics();

            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

            // Draw rounded logo icon container (Warm CafeFlow Amber/Orange theme #C2410C)
            g2d.setColor(new java.awt.Color(194, 65, 12));
            g2d.fillRoundRect(10, 15, 90, 90, 26, 26);

            // Draw Coffee Cup symbol inside icon box
            g2d.setColor(java.awt.Color.WHITE);
            g2d.setStroke(new BasicStroke(5f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
            // Cup body
            g2d.drawRoundRect(30, 46, 38, 34, 10, 10);
            // Handle
            g2d.drawArc(62, 50, 20, 20, 270, 180);
            // Steam lines
            g2d.drawArc(36, 30, 10, 10, 0, 180);
            g2d.drawArc(50, 30, 10, 10, 0, 180);

            // Draw Brand Name Text "CafeFlow"
            g2d.setFont(new java.awt.Font("SansSerif", java.awt.Font.PLAIN, 44));
            g2d.setColor(new java.awt.Color(43, 30, 22)); // Dark espresso text
            g2d.drawString("CafeFlow", 118, 68);

            // Subtitle "DIGITAL CAFE & KITCHEN"
            g2d.setFont(new java.awt.Font("SansSerif", java.awt.Font.PLAIN, 13));
            g2d.setColor(new java.awt.Color(194, 65, 12)); // Amber tracking text
            g2d.drawString("DIGITAL CAFE & KITCHEN", 120, 92);

            g2d.dispose();
            ImageIO.write(image, "png", new File(logoPath));
        } catch (Exception e) {
            log.error("Failed to generate logo image for PDF", e);
        }
        return logoPath;
    }

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
            Invoice inv = existing.get();
            String pdfFilename = inv.getInvoiceNumber() + ".pdf";
            String absolutePath = uploadDir + "invoices/" + pdfFilename;
            createPdfInvoice(order, inv.getInvoiceNumber(), absolutePath);
            return inv;
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

    public void createPdfInvoice(Order order, String invoiceNumber, String destPath) {
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        try {
            PdfWriter.getInstance(document, new FileOutputStream(destPath));
            document.open();

            // Web UI Color Palette
            java.awt.Color BRAND_PRIMARY = new java.awt.Color(194, 65, 12); // Amber Accent #C2410C
            java.awt.Color BRAND_DARK = new java.awt.Color(43, 30, 22); // Dark Espresso #2B1E16
            java.awt.Color BRAND_LIGHT_BG = new java.awt.Color(254, 243, 199);// Light Cream #FEF3C7
            java.awt.Color HEADER_BG = new java.awt.Color(124, 45, 18); // Warm Brown Header #7C2D12
            java.awt.Color ALT_ROW_BG = new java.awt.Color(255, 251, 235); // Soft Cream Row #FFFBEB
            java.awt.Color SUCCESS_GREEN = new java.awt.Color(16, 185, 129); // Emerald Green #10B981
            java.awt.Color BORDER_COLOR = new java.awt.Color(243, 228, 203); // Border #F3E4CB
            java.awt.Color TEXT_MUTED = new java.awt.Color(146, 64, 14); // Amber Text Muted #92400E

            // Fonts (All Normal / Plain weight)
            Font sectionTitleFont = new Font(Font.HELVETICA, 12f, Font.NORMAL, BRAND_DARK);
            Font headerFont = new Font(Font.HELVETICA, 10f, Font.NORMAL, java.awt.Color.WHITE);
            Font bodyFont = new Font(Font.HELVETICA, 10f, Font.NORMAL, BRAND_DARK);
            Font mutedFont = new Font(Font.HELVETICA, 9f, Font.NORMAL, TEXT_MUTED);
            Font statusFont = new Font(Font.HELVETICA, 10f, Font.NORMAL, SUCCESS_GREEN);
            Font totalFont = new Font(Font.HELVETICA, 11f, Font.NORMAL, java.awt.Color.WHITE);
            Font footerFont = new Font(Font.HELVETICA, 10f, Font.NORMAL, BRAND_PRIMARY);

            // Webpage Logo Header
            String logoPath = ensureLogoExists();
            if (logoPath != null) {
                try {
                    com.lowagie.text.Image logo = com.lowagie.text.Image.getInstance(logoPath);
                    logo.scaleToFit(210, 70);
                    logo.setAlignment(Element.ALIGN_CENTER);
                    logo.setSpacingAfter(8);
                    document.add(logo);
                } catch (Exception ie) {
                    log.warn("Could not attach logo to PDF invoice", ie);
                }
            }

            // Title
            Paragraph title = new Paragraph("OFFICIAL TAX INVOICE & RECEIPT", sectionTitleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(18);
            document.add(title);

            // Info Table (Order & Customer Meta Box)
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(20);

            PdfPCell cellLeft = new PdfPCell();
            cellLeft.setBackgroundColor(BRAND_LIGHT_BG);
            cellLeft.setPadding(12);
            cellLeft.setBorderColor(BORDER_COLOR);
            cellLeft.setBorderWidth(1f);

            Paragraph leftText = new Paragraph();
            leftText.add(new Chunk("Invoice #: ", bodyFont));
            leftText.add(new Chunk(invoiceNumber + "\n", bodyFont));
            leftText.add(new Chunk("Date: ", bodyFont));
            leftText.add(new Chunk(
                    order.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + "\n", bodyFont));
            leftText.add(new Chunk("Order ID: ", bodyFont));
            leftText.add(new Chunk(order.getOrderIdFormatted(), bodyFont));
            cellLeft.addElement(leftText);
            infoTable.addCell(cellLeft);

            PdfPCell cellRight = new PdfPCell();
            cellRight.setBackgroundColor(BRAND_LIGHT_BG);
            cellRight.setPadding(12);
            cellRight.setBorderColor(BORDER_COLOR);
            cellRight.setBorderWidth(1f);

            Paragraph rightText = new Paragraph();
            rightText.add(new Chunk("CafeFlow Digital Cafe & Kitchen\n", bodyFont));
            rightText.add(new Chunk("Customer Mobile: " + order.getCustomer().getMobileNumber() + "\n", bodyFont));
            rightText.add(new Chunk("Payment Status: ", bodyFont));
            rightText.add(new Chunk(" PAID ", statusFont));
            cellRight.addElement(rightText);
            infoTable.addCell(cellRight);

            document.add(infoTable);

            // Items Table
            PdfPTable itemsTable = new PdfPTable(new float[] { 3.5f, 0.8f, 1.2f, 1.2f });
            itemsTable.setWidthPercentage(100);
            itemsTable.setSpacingAfter(20);

            // Table Headers
            String[] headers = { "Item & Customizations", "Qty", "Unit Price", "Total Price" };
            for (String header : headers) {
                PdfPCell headerCell = new PdfPCell(new Paragraph(header, headerFont));
                headerCell.setBackgroundColor(HEADER_BG);
                headerCell.setPadding(8);
                headerCell.setBorderColor(BORDER_COLOR);
                if (!header.equals("Item & Customizations")) {
                    headerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                }
                itemsTable.addCell(headerCell);
            }

            int rowIndex = 0;
            for (OrderItem item : order.getItems()) {
                java.awt.Color rowBg = (rowIndex % 2 == 0) ? java.awt.Color.WHITE : ALT_ROW_BG;

                Paragraph itemParagraph = new Paragraph();
                itemParagraph.add(new Chunk(item.getProductName(), bodyFont));
                if (item.getCustomizations() != null && !item.getCustomizations().isEmpty()) {
                    String customsStr = "\nCustoms: " + item.getCustomizations().stream()
                            .map(c -> c.getCustomizationOptionName() + " (+₹" + c.getAdditionalPrice() + ")")
                            .collect(Collectors.joining(", "));
                    itemParagraph.add(new Chunk(customsStr, mutedFont));
                }

                PdfPCell nameCell = new PdfPCell(itemParagraph);
                nameCell.setBackgroundColor(rowBg);
                nameCell.setPadding(8);
                nameCell.setBorderColor(BORDER_COLOR);
                itemsTable.addCell(nameCell);

                PdfPCell qtyCell = new PdfPCell(new Paragraph(item.getQuantity().toString(), bodyFont));
                qtyCell.setBackgroundColor(rowBg);
                qtyCell.setPadding(8);
                qtyCell.setBorderColor(BORDER_COLOR);
                qtyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                itemsTable.addCell(qtyCell);

                PdfPCell priceCell = new PdfPCell(new Paragraph("₹" + item.getUnitFinalPrice().toString(), bodyFont));
                priceCell.setBackgroundColor(rowBg);
                priceCell.setPadding(8);
                priceCell.setBorderColor(BORDER_COLOR);
                priceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                itemsTable.addCell(priceCell);

                PdfPCell totalCell = new PdfPCell(new Paragraph("₹" + item.getTotalPrice().toString(), bodyFont));
                totalCell.setBackgroundColor(rowBg);
                totalCell.setPadding(8);
                totalCell.setBorderColor(BORDER_COLOR);
                totalCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                itemsTable.addCell(totalCell);

                rowIndex++;
            }

            document.add(itemsTable);

            // Summary Table
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(45);
            summaryTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
            summaryTable.setSpacingAfter(24);

            // Subtotal
            PdfPCell lblSub = new PdfPCell(new Paragraph("Subtotal:", bodyFont));
            lblSub.setPadding(6);
            lblSub.setBorderColor(BORDER_COLOR);
            summaryTable.addCell(lblSub);

            PdfPCell valSub = new PdfPCell(new Paragraph("₹" + order.getSubtotal().toString(), bodyFont));
            valSub.setPadding(6);
            valSub.setBorderColor(BORDER_COLOR);
            valSub.setHorizontalAlignment(Element.ALIGN_RIGHT);
            summaryTable.addCell(valSub);

            // Tax
            PdfPCell lblTax = new PdfPCell(new Paragraph("Tax (5% GST):", bodyFont));
            lblTax.setPadding(6);
            lblTax.setBorderColor(BORDER_COLOR);
            summaryTable.addCell(lblTax);

            PdfPCell valTax = new PdfPCell(new Paragraph("₹" + order.getTax().toString(), bodyFont));
            valTax.setPadding(6);
            valTax.setBorderColor(BORDER_COLOR);
            valTax.setHorizontalAlignment(Element.ALIGN_RIGHT);
            summaryTable.addCell(valTax);

            // Discount
            PdfPCell lblDisc = new PdfPCell(new Paragraph("Discount:", bodyFont));
            lblDisc.setPadding(6);
            lblDisc.setBorderColor(BORDER_COLOR);
            summaryTable.addCell(lblDisc);

            PdfPCell valDisc = new PdfPCell(new Paragraph("-₹" + order.getDiscount().toString(), bodyFont));
            valDisc.setPadding(6);
            valDisc.setBorderColor(BORDER_COLOR);
            valDisc.setHorizontalAlignment(Element.ALIGN_RIGHT);
            summaryTable.addCell(valDisc);

            // Total
            PdfPCell totalLabel = new PdfPCell(new Paragraph("Total Paid:", totalFont));
            totalLabel.setBackgroundColor(BRAND_PRIMARY);
            totalLabel.setPadding(8);
            totalLabel.setBorderColor(BRAND_PRIMARY);
            summaryTable.addCell(totalLabel);

            PdfPCell cellTot = new PdfPCell(new Paragraph("₹" + order.getFinalAmount().toString(), totalFont));
            cellTot.setBackgroundColor(BRAND_PRIMARY);
            cellTot.setPadding(8);
            cellTot.setBorderColor(BRAND_PRIMARY);
            cellTot.setHorizontalAlignment(Element.ALIGN_RIGHT);
            summaryTable.addCell(cellTot);

            document.add(summaryTable);

            // Footer Note
            Paragraph footer = new Paragraph("☕ Thank you for dining with CafeFlow!\nHave a wonderful day!", footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

        } catch (DocumentException | IOException de) {
            log.error("Failed to compile pdf invoice for order " + order.getOrderIdFormatted(), de);
        } finally {
            if (document != null && document.isOpen()) {
                document.close();
            }
        }
    }

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    private Long getInvoiceSeq() {
        return ((Number) entityManager.createNativeQuery("SELECT nextval('invoice_number_seq')").getSingleResult())
                .longValue();
    }
}
