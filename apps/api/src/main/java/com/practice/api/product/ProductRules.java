package com.practice.api.product;

import java.math.BigDecimal;

/**
 * Reglas de alta para GraphQL y gRPC, que reciben el precio como texto. REST usa Bean Validation y SOAP
 * el XSD: cada protocolo valida a su manera, con las mismas reglas.
 */
public final class ProductRules {

	private ProductRules() {
	}

	public static String name(String name) {
		if (name == null || name.isBlank() || name.strip().length() > 100) {
			throw new IllegalArgumentException("name: obligatorio, máximo 100 caracteres");
		}
		return name.strip();
	}

	public static BigDecimal price(String price) {
		BigDecimal value;
		try {
			value = new BigDecimal(price);
		}
		catch (NumberFormatException | NullPointerException e) {
			throw new IllegalArgumentException("price: debe ser un número decimal, por ejemplo \"12.50\"");
		}
		if (value.signum() <= 0 || value.scale() > 2) {
			throw new IllegalArgumentException("price: mayor que 0 y con máximo 2 decimales");
		}
		return value;
	}

}
