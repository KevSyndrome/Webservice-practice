package com.practice.api.product;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

/** Prueba de punta a punta: HTTP -> puente -> cliente gRPC -> servidor gRPC -> SQLite. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class GrpcBridgeControllerTests {

	@Value("${local.server.port}")
	int port;

	HttpClient http = HttpClient.newHttpClient();

	HttpResponse<String> send(HttpRequest.Builder request) throws Exception {
		return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
	}

	URI uri(String path) {
		return URI.create("http://localhost:" + port + "/api/v1/grpc-bridge/products" + path);
	}

	@Test
	void getProductReturnsProtobufText() throws Exception {
		HttpResponse<String> response = send(HttpRequest.newBuilder(uri("/1")));
		assertThat(response.statusCode()).isEqualTo(200);
		assertThat(response.body()).contains("\"status\":\"OK\"")
			.contains("products.v1.ProductService/GetProduct")
			.contains("name: \\\"Teclado\\\"");
	}

	@Test
	void missingProductMapsNotFound() throws Exception {
		HttpResponse<String> response = send(HttpRequest.newBuilder(uri("/999")));
		assertThat(response.statusCode()).isEqualTo(404);
		assertThat(response.body()).contains("\"status\":\"NOT_FOUND\"");
	}

	@Test
	void invalidCreateMapsInvalidArgument() throws Exception {
		HttpResponse<String> response = send(HttpRequest.newBuilder(uri(""))
			.header("Content-Type", "application/json")
			.POST(HttpRequest.BodyPublishers.ofString("{\"name\":\"X\",\"price\":\"abc\"}")));
		assertThat(response.statusCode()).isEqualTo(400);
		assertThat(response.body()).contains("\"status\":\"INVALID_ARGUMENT\"");
	}

}
