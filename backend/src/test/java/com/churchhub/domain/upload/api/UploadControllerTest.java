package com.churchhub.domain.upload.api;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class UploadControllerTest {

    @Test
    void 이미지_매직넘버로_형식을_판별함() {
        assertThat(UploadController.detectImageType(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0})).isEqualTo("image/jpeg");
        assertThat(UploadController.detectImageType(new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A})).isEqualTo("image/png");
        assertThat(UploadController.detectImageType("GIF89a".getBytes(StandardCharsets.US_ASCII))).isEqualTo("image/gif");
        assertThat(UploadController.detectImageType("RIFF0000WEBPVP8 ".getBytes(StandardCharsets.US_ASCII))).isEqualTo("image/webp");
    }

    @Test
    void 이미지가_아니면_null() {
        assertThat(UploadController.detectImageType("<svg onload=alert(1)>".getBytes(StandardCharsets.UTF_8))).isNull();
        assertThat(UploadController.detectImageType("<html>".getBytes(StandardCharsets.UTF_8))).isNull();
        assertThat(UploadController.detectImageType(new byte[0])).isNull();
    }
}
