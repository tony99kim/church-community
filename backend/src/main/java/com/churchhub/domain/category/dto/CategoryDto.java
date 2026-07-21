package com.churchhub.domain.category.dto;

import com.churchhub.domain.category.entity.Category;
import com.churchhub.domain.category.entity.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

public class CategoryDto {

    @Getter
    public static class CreateRequest {
        @NotBlank(message = "카테고리 이름을 입력해주세요.")
        private String name;
        private String description;
        @NotNull(message = "카테고리 타입을 선택해주세요.")
        private CategoryType type;
        private int sortOrder;
    }

    @Getter
    public static class UpdateRequest {
        @NotBlank
        private String name;
        private String description;
        @NotNull
        private CategoryType type;
        private boolean visible;
        private int sortOrder;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String name;
        private String description;
        private CategoryType type;
        private boolean visible;
        private int sortOrder;

        public static Response from(Category category) {
            return Response.builder()
                    .id(category.getId())
                    .name(category.getName())
                    .description(category.getDescription())
                    .type(category.getType())
                    .visible(category.isVisible())
                    .sortOrder(category.getSortOrder())
                    .build();
        }
    }
}
