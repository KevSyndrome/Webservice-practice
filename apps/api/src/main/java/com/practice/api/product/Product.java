package com.practice.api.product;

import java.math.BigDecimal;

public record Product(long id, String name, BigDecimal price) {
}
