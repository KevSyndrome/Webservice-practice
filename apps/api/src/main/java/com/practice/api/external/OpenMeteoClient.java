package com.practice.api.external;

import org.springframework.web.client.RestClient;

/** Cliente REST de Open-Meteo (sin API key). */
public class OpenMeteoClient {

	private final RestClient restClient;

	public OpenMeteoClient(RestClient restClient) {
		this.restClient = restClient;
	}

	public Weather current(double latitude, double longitude) {
		Forecast forecast = restClient.get()
			.uri("/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,wind_speed_10m", latitude,
					longitude)
			.retrieve()
			.body(Forecast.class);
		return new Weather(forecast.current().time(), forecast.current().temperature_2m(),
				forecast.current().wind_speed_10m());
	}

	public record Weather(String time, double temperatureC, double windKmh) {
	}

	// Solo los campos que usamos del JSON de Open-Meteo; el resto se ignora
	record Forecast(Current current) {
	}

	record Current(String time, double temperature_2m, double wind_speed_10m) {
	}

}
