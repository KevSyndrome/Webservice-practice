package com.practice.api.product;

import java.util.List;

import graphql.GraphQLError;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.GraphQlExceptionHandler;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.stereotype.Controller;

@Controller
public class ProductGraphqlController {

	private final ProductRepository repository;

	public ProductGraphqlController(ProductRepository repository) {
		this.repository = repository;
	}

	@QueryMapping
	public List<Product> products() {
		return repository.findAll();
	}

	// Si no existe devuelve null: en GraphQL "no encontrado" no es un error
	@QueryMapping
	public Product product(@Argument long id) {
		return repository.findById(id).orElse(null);
	}

	@MutationMapping
	public Product createProduct(@Argument NewProductInput input) {
		return repository.save(ProductRules.name(input.name()), ProductRules.price(input.price()));
	}

	@SchemaMapping(typeName = "Product", field = "price")
	public String price(Product product) {
		return product.price().toPlainString();
	}

	// Va en la lista "errors" de la respuesta, con HTTP 200
	@GraphQlExceptionHandler
	public GraphQLError invalidInput(IllegalArgumentException e) {
		return GraphQLError.newError().errorType(ErrorType.BAD_REQUEST).message(e.getMessage()).build();
	}

	public record NewProductInput(String name, String price) {
	}

}
