package com.practice.api.external;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class OpenMeteoClientTests {

	@Test
	void mapsCurrentWeather() {
		RestClient.Builder builder = RestClient.builder().baseUrl("http://openmeteo.test");
		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
		OpenMeteoClient client = new OpenMeteoClient(builder.build());

		server.expect(requestTo(
				"http://openmeteo.test/v1/forecast?latitude=19.43&longitude=-99.13&current=temperature_2m,wind_speed_10m"))
			.andRespond(withSuccess("""
					{"latitude":19.43,"current":{"time":"2026-10-30T15:00","interval":900,
					 "temperature_2m":16.7,"wind_speed_10m":0.6}}""", MediaType.APPLICATION_JSON));

		var weather = client.current(19.43, -99.13);

		assertThat(weather.temperatureC()).isEqualTo(16.7);
		assertThat(weather.windKmh()).isEqualTo(0.6);
		server.verify();
	}

}
