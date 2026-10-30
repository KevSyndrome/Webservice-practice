package com.practice.api.external;

import java.time.Duration;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.oxm.jaxb.Jaxb2Marshaller;
import org.springframework.web.client.RestClient;
import org.springframework.ws.client.core.WebServiceTemplate;
import org.springframework.ws.transport.http.HttpUrlConnectionMessageSender;

@Configuration
public class ExternalConfig {

	private static final Duration TIMEOUT = Duration.ofSeconds(5);

	@Bean
	public Jaxb2Marshaller countryInfoMarshaller() {
		Jaxb2Marshaller marshaller = new Jaxb2Marshaller();
		marshaller.setContextPath("com.practice.api.external.countryinfo");
		return marshaller;
	}

	@Bean
	public CountryInfoClient countryInfoClient(Jaxb2Marshaller countryInfoMarshaller,
			@Value("${external.countryinfo.url}") String url) {
		HttpUrlConnectionMessageSender sender = new HttpUrlConnectionMessageSender();
		sender.setConnectionTimeout(TIMEOUT);
		sender.setReadTimeout(TIMEOUT);
		WebServiceTemplate template = new WebServiceTemplate(countryInfoMarshaller);
		template.setMessageSender(sender);
		template.setDefaultUri(url);
		return new CountryInfoClient(template);
	}

	@Bean
	public OpenMeteoClient openMeteoClient(@Value("${external.openmeteo.url}") String url) {
		return new OpenMeteoClient(restClient(url));
	}

	@Bean
	public CountriesGraphqlClient countriesGraphqlClient(@Value("${external.countries-graphql.url}") String url) {
		return new CountriesGraphqlClient(restClient(url));
	}

	// TLS (el valor por defecto de gRPC). El canal es perezoso: no conecta hasta la primera llamada
	@Bean(destroyMethod = "shutdownNow")
	public ManagedChannel grpcBinChannel(@Value("${external.grpcbin.address}") String address) {
		return ManagedChannelBuilder.forTarget(address).useTransportSecurity().build();
	}

	@Bean
	public GrpcBinClient grpcBinClient(ManagedChannel grpcBinChannel) {
		return new GrpcBinClient(grpcBinChannel);
	}

	private static RestClient restClient(String url) {
		JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory();
		factory.setReadTimeout(TIMEOUT);
		return RestClient.builder().baseUrl(url).requestFactory(factory).build();
	}

}
