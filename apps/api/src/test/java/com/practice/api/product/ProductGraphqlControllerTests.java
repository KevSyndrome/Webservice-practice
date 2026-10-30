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
class ProductGraphqlControllerTests {

	@Value("${local.server.port}")
	int port;

	HttpResponse<String> graphql(String query) throws Exception {
		String body = "{\"query\":\"" + query.replace("\"", "\\\"") + "\"}";
		HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/graphql"))
			.header("Content-Type", "application/json")
			.POST(HttpRequest.BodyPublishers.ofString(body))
			.build();
		return HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
	}

	@Test
	void returnsOnlyRequestedFields() throws Exception {
		HttpResponse<String> response = graphql("{ product(id: 1) { name } }");
		assertThat(response.statusCode()).isEqualTo(200);
		assertThat(response.body()).isEqualTo("{\"data\":{\"product\":{\"name\":\"Teclado\"}}}");
	}

	@Test
	void missingProductIsNull() throws Exception {
		assertThat(graphql("{ product(id: 999) { name } }").body()).contains("\"product\":null");
	}

	@Test
	void createKeepsDecimals() throws Exception {
		HttpResponse<String> response = graphql(
				"mutation { createProduct(input: {name: \"Monitor\", price: \"3999.00\"}) { id price } }");
		assertThat(response.body()).contains("\"price\":\"3999.00\"").doesNotContain("errors");
	}

	@Test
	void invalidInputGoesToErrorsWithHttp200() throws Exception {
		HttpResponse<String> response = graphql("mutation { createProduct(input: {name: \"X\", price: \"-1\"}) { id } }");
		assertThat(response.statusCode()).isEqualTo(200);
		assertThat(response.body()).contains("errors").contains("BAD_REQUEST").contains("price:");
	}

}
