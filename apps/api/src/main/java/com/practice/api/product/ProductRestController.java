package com.practice.api.product;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/products")
public class ProductRestController {

	private final ProductRepository repository;

	public ProductRestController(ProductRepository repository) {
		this.repository = repository;
	}

	@GetMapping
	public List<Product> list() {
		return repository.findAll();
	}

	@GetMapping("/{id}")
	public Product get(@PathVariable long id) {
		return repository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto " + id + " no existe"));
	}

	@PostMapping
	public ResponseEntity<Product> create(@Valid @RequestBody NewProduct request) {
		Product product = repository.save(request.name(), request.price());
		return ResponseEntity.created(URI.create("/api/v1/products/" + product.id())).body(product);
	}

	public record NewProduct(@NotBlank @Size(max = 100) String name,
			@NotNull @Positive @Digits(integer = 10, fraction = 2) BigDecimal price) {
	}

}
