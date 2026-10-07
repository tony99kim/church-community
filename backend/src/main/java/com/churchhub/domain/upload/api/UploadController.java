package com.churchhub.domain.upload.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import com.churchhub.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
public class UploadController {

    private final RestTemplate restTemplate;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    @Value("${supabase.bucket}")
    private String bucket;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails userDetails) throws Exception {

        byte[] bytes = file.getBytes();
        String mimeType = detectImageType(bytes);
        if (mimeType == null) throw new BusinessException(ErrorCode.INVALID_FILE_TYPE);
        String path = UUID.randomUUID() + "." + EXTENSIONS.get(mimeType);

        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + path;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + serviceRoleKey);
        headers.setContentType(MediaType.parseMediaType(mimeType));

        HttpEntity<byte[]> entity = new HttpEntity<>(bytes, headers);
        Exception lastError = null;
        for (int attempt = 0; attempt < 2; attempt++) {
            try {
                restTemplate.exchange(uploadUrl, HttpMethod.POST, entity, String.class);
                String publicUrl = supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + path;
                return ResponseEntity.ok(ApiResponse.success(Map.of("url", publicUrl)));
            } catch (Exception e) {
                lastError = e;
            }
        }
        throw lastError;
    }

    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg", "image/png", "png", "image/gif", "gif", "image/webp", "webp");

    // 클라이언트가 보낸 Content-Type·파일명 대신 실제 바이트(매직 넘버)로 판별
    static String detectImageType(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return "image/jpeg";
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') return "image/png";
        if (b.length >= 6 && b[0] == 'G' && b[1] == 'I' && b[2] == 'F' && b[3] == '8') return "image/gif";
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "image/webp";
        return null;
    }
}
