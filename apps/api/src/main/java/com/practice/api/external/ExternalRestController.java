package com.practice.api.external;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import io.grpc.StatusRuntimeException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.client.GraphQlClientException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.ws.client.WebServiceClientException;

/** Expone los WS externos como REST propio; el portal no sabe si detrás hay SOAP o REST. */
@RestController
@RequestMapping("/api/v1")
public class ExternalRestController {

	private static final Logger log = LoggerFactory.getLogger(ExternalRestController.class);

	private final CountryInfoClient countryInfo;
	private final OpenMeteoClient openMeteo;
	private final CountriesGraphqlClient countriesGraphql;
	private final GrpcBinClient grpcBin;

	public ExternalRestController(CountryInfoClient countryInfo, OpenMeteoClient openMeteo,
			CountriesGraphqlClient countriesGraphql, GrpcBinClient grpcBin) {
		this.countryInfo = countryInfo;
		this.openMeteo = openMeteo;
		this.countriesGraphql = countriesGraphql;
		this.grpcBin = grpcBin;
	}

	@GetMapping("/countries/{isoCode}")
	public CountryInfoClient.Country country(@PathVariable @Pattern(regexp = "[A-Za-z]{2}") String isoCode) {
		return countryInfo.find(isoCode.toUpperCase())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "País " + isoCode + " no existe"));
	}

	@GetMapping("/weather")
	public OpenMeteoClient.Weather weather(@RequestParam @DecimalMin("-90") @DecimalMax("90") double lat,
			@RequestParam @DecimalMin("-180") @DecimalMax("180") double lon) {
		return openMeteo.current(lat, lon);
	}

	@GetMapping("/graphql-countries/{code}")
	public CountriesGraphqlClient.Country graphqlCountry(@PathVariable @Pattern(regexp = "[A-Za-z]{2}") String code) {
		return countriesGraphql.find(code.toUpperCase())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "País " + code + " no existe"));
	}

	@GetMapping("/greeting")
	public Greeting greeting(@RequestParam @NotBlank @Size(max = 100) String name) {
		return new Greeting(grpcBin.sayHello(name));
	}

	public record Greeting(String reply) {
	}

	// Falla del proveedor externo (caído, timeout, respuesta inválida) -> 502, no 500
	@ExceptionHandler({ RestClientException.class, WebServiceClientException.class, GraphQlClientException.class,
			StatusRuntimeException.class })
	ProblemDetail upstreamFailed(RuntimeException e) {
		log.warn("Proveedor externo falló: {}", e.toString());
		return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_GATEWAY, "Proveedor externo no disponible");
	}

}
