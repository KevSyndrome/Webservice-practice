package com.practice.api.product;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentSkipListMap;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.stereotype.Repository;

// shortcut: datos en memoria, se pierden al reiniciar; cambiar a JPA + BD cuando haga falta persistir
@Repository
public class ProductRepository {

	private final Map<Long, Product> products = new ConcurrentSkipListMap<>();
	private final AtomicLong sequence = new AtomicLong();

	public ProductRepository() {
		save("Teclado", new BigDecimal("499.90"));
		save("Mouse", new BigDecimal("249.50"));
	}

	public List<Product> findAll() {
		return List.copyOf(products.values());
	}

	public Optional<Product> findById(long id) {
		return Optional.ofNullable(products.get(id));
	}

	public Product save(String name, BigDecimal price) {
		Product product = new Product(sequence.incrementAndGet(), name, price);
		products.put(product.id(), product);
		return product;
	}

}
