package com.practice.api.product;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ProductRestControllerTests {

	@Value("${local.server.port}")
	int port;

	HttpClient http = HttpClient.newHttpClient();

	HttpResponse<String> send(HttpRequest.Builder request) throws Exception {
		return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
	}

	URI uri(String path) {
		return URI.create("http://localhost:" + port + path);
	}

	@Test
	void getExistingProduct() throws Exception {
		HttpResponse<String> response = send(HttpRequest.newBuilder(uri("/api/v1/products/1")));
		assertThat(response.statusCode()).isEqualTo(200);
		assertThat(response.body()).contains("\"name\":\"Teclado\"");
	}

	@Test
	void missingProductReturnsProblemDetail() throws Exception {
		HttpResponse<String> response = send(HttpRequest.newBuilder(uri("/api/v1/products/999")));
		assertThat(response.statusCode()).isEqualTo(404);
		assertThat(response.headers().firstValue("Content-Type")).hasValueSatisfying(
				type -> assertThat(type).startsWith("application/problem+json"));
	}

	@Test
	void createRejectsInvalidBody() throws Exception {
		HttpResponse<String> response = send(HttpRequest.newBuilder(uri("/api/v1/products"))
			.header("Content-Type", "application/json")
			.POST(HttpRequest.BodyPublishers.ofString("{\"name\":\"\",\"price\":-1}")));
		assertThat(response.statusCode()).isEqualTo(400);
	}

	@Test
	void createReturnsLocation() throws Exception {
		HttpResponse<String> response = send(HttpRequest.newBuilder(uri("/api/v1/products"))
			.header("Content-Type", "application/json")
			.POST(HttpRequest.BodyPublishers.ofString("{\"name\":\"Monitor\",\"price\":3999.00}")));
		assertThat(response.statusCode()).isEqualTo(201);
		assertThat(response.headers().firstValue("Location")).hasValueSatisfying(
				location -> assertThat(location).startsWith("/api/v1/products/"));
	}

	@Test
	void openApiContractIsPublished() throws Exception {
		HttpResponse<String> response = send(HttpRequest.newBuilder(uri("/v3/api-docs")));
		assertThat(response.statusCode()).isEqualTo(200);
		assertThat(response.body()).contains("/api/v1/products/{id}");
	}

}
