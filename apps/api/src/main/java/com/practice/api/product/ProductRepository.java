package com.practice.api.product;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ProductRepository {

	private final JdbcClient jdbc;

	public ProductRepository(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	public List<Product> findAll() {
		return jdbc.sql("SELECT id, name, price FROM product ORDER BY id").query(ProductRepository::map).list();
	}

	public Optional<Product> findById(long id) {
		return jdbc.sql("SELECT id, name, price FROM product WHERE id = ?").param(id).query(ProductRepository::map)
			.optional();
	}

	public Product save(String name, BigDecimal price) {
		return jdbc.sql("INSERT INTO product (name, price) VALUES (?, ?) RETURNING id, name, price")
			.params(name, price.toPlainString())
			.query(ProductRepository::map)
			.single();
	}

	// price se guarda como TEXT: SQLite no tiene DECIMAL y REAL perdería centavos
	private static Product map(ResultSet rs, int row) throws SQLException {
		return new Product(rs.getLong("id"), rs.getString("name"), new BigDecimal(rs.getString("price")));
	}

}
