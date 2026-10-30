package com.practice.api.external;

import java.util.List;
import java.util.Optional;

import org.springframework.graphql.client.HttpSyncGraphQlClient;
import org.springframework.web.client.RestClient;

/** Cliente GraphQL de countries.trevorblades.com: pedimos solo los campos que usamos. */
public class CountriesGraphqlClient {

	static final String QUERY = """
			query Country($code: ID!) {
			  country(code: $code) {
			    name
			    capital
			    currency
			    emoji
			    continent { name }
			    languages { name }
			  }
			}""";

	private final HttpSyncGraphQlClient client;

	public CountriesGraphqlClient(RestClient restClient) {
		this.client = HttpSyncGraphQlClient.create(restClient);
	}

	public Optional<Country> find(String code) {
		GraphqlCountry country = client.document(QUERY)
			.variable("code", code)
			.retrieveSync("country")
			.toEntity(GraphqlCountry.class);
		return Optional.ofNullable(country)
			.map(c -> new Country(code, c.name(), c.capital(), c.currency(), c.emoji(), c.continent().name(),
					c.languages().stream().map(Named::name).toList()));
	}

	public record Country(String code, String name, String capital, String currency, String emoji, String continent,
			List<String> languages) {
	}

	record GraphqlCountry(String name, String capital, String currency, String emoji, Named continent,
			List<Named> languages) {
	}

	record Named(String name) {
	}

}
