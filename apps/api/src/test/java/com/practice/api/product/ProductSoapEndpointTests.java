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
class ProductSoapEndpointTests {

	@Value("${local.server.port}")
	int port;

	HttpClient http = HttpClient.newHttpClient();

	HttpResponse<String> soap(String body) throws Exception {
		String envelope = """
				<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
				                  xmlns:p="http://practice.com/products/v1">
				  <soapenv:Body>%s</soapenv:Body>
				</soapenv:Envelope>""".formatted(body);
		HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/ws"))
			.header("Content-Type", "text/xml; charset=utf-8")
			.header("SOAPAction", "\"\"")
			.POST(HttpRequest.BodyPublishers.ofString(envelope))
			.build();
		return http.send(request, HttpResponse.BodyHandlers.ofString());
	}

	@Test
	void getExistingProduct() throws Exception {
		HttpResponse<String> response = soap("<p:getProductRequest><p:id>1</p:id></p:getProductRequest>");
		assertThat(response.statusCode()).isEqualTo(200);
		assertThat(response.body()).contains("getProductResponse").contains("Teclado");
	}

	@Test
	void listProducts() throws Exception {
		HttpResponse<String> response = soap("<p:listProductsRequest/>");
		assertThat(response.statusCode()).isEqualTo(200);
		assertThat(response.body()).contains("Teclado").contains("Mouse");
	}

	@Test
	void missingProductReturnsSoapFault() throws Exception {
		HttpResponse<String> response = soap("<p:getProductRequest><p:id>999</p:id></p:getProductRequest>");
		assertThat(response.statusCode()).isEqualTo(500);
		assertThat(response.body()).contains("Fault").contains("Producto 999 no existe");
	}

	@Test
	void createProduct() throws Exception {
		HttpResponse<String> response = soap(
				"<p:createProductRequest><p:name>Monitor</p:name><p:price>3999.00</p:price></p:createProductRequest>");
		assertThat(response.statusCode()).isEqualTo(200);
		assertThat(response.body()).contains("createProductResponse").contains("Monitor").contains("3999.00");
	}

	@Test
	void createRejectsPayloadThatBreaksTheXsd() throws Exception {
		HttpResponse<String> response = soap(
				"<p:createProductRequest><p:name> </p:name><p:price>-5</p:price></p:createProductRequest>");
		assertThat(response.statusCode()).isEqualTo(500);
		assertThat(response.body()).contains("Fault").contains("Validation error");
	}

	@Test
	void wsdlContractIsPublished() throws Exception {
		HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/ws/products.wsdl")).build();
		HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
		assertThat(response.statusCode()).isEqualTo(200);
		assertThat(response.body()).contains("ProductsPort").contains("getProduct");
	}

}
