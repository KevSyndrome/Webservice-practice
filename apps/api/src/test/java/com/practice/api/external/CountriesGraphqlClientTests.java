package com.practice.api.external;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class CountriesGraphqlClientTests {

	MockRestServiceServer server;
	CountriesGraphqlClient client;

	@BeforeEach
	void setUp() {
		RestClient.Builder builder = RestClient.builder().baseUrl("http://countries.test/graphql");
		server = MockRestServiceServer.bindTo(builder).build();
		client = new CountriesGraphqlClient(builder.build());
	}

	@Test
	void sendsQueryWithVariablesAndMapsCountry() {
		server.expect(method(HttpMethod.POST))
			.andExpect(jsonPath("$.variables.code").value("MX"))
			.andRespond(withSuccess("""
					{"data":{"country":{"name":"Mexico","capital":"Mexico City","currency":"MXN","emoji":"🇲🇽",
					 "continent":{"name":"North America"},"languages":[{"name":"Spanish"}]}}}""",
					MediaType.APPLICATION_JSON));

		var country = client.find("MX").orElseThrow();

		assertThat(country.continent()).isEqualTo("North America");
		assertThat(country.languages()).containsExactly("Spanish");
		server.verify();
	}

	@Test
	void nullCountryMeansNotFound() {
		server.expect(method(HttpMethod.POST))
			.andRespond(withSuccess("{\"data\":{\"country\":null}}", MediaType.APPLICATION_JSON));

		assertThat(client.find("ZZ")).isEmpty();
	}

}
