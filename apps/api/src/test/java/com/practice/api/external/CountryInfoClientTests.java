package com.practice.api.external;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.ws.test.client.RequestMatchers.payload;
import static org.springframework.ws.test.client.ResponseCreators.withPayload;

import javax.xml.transform.Source;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ws.client.core.WebServiceTemplate;
import org.springframework.ws.test.client.MockWebServiceServer;
import org.springframework.xml.transform.StringSource;

class CountryInfoClientTests {

	static final String NS = "http://www.oorsprong.org/websamples.countryinfo";

	MockWebServiceServer server;
	CountryInfoClient client;

	@BeforeEach
	void setUp() throws Exception {
		ExternalConfig config = new ExternalConfig();
		var marshaller = config.countryInfoMarshaller();
		marshaller.afterPropertiesSet();
		WebServiceTemplate template = new WebServiceTemplate(marshaller);
		template.setDefaultUri("http://countryinfo.test");
		server = MockWebServiceServer.createServer(template);
		client = new CountryInfoClient(template);
	}

	Source request(String iso) {
		return new StringSource("""
				<FullCountryInfo xmlns="%s"><sCountryISOCode>%s</sCountryISOCode></FullCountryInfo>"""
			.formatted(NS, iso));
	}

	Source response(String iso, String name, String languages) {
		return new StringSource("""
				<m:FullCountryInfoResponse xmlns:m="%s"><m:FullCountryInfoResult>
				  <m:sISOCode>%s</m:sISOCode><m:sName>%s</m:sName><m:sCapitalCity>Mexico City</m:sCapitalCity>
				  <m:sPhoneCode>52</m:sPhoneCode><m:sContinentCode>AM</m:sContinentCode>
				  <m:sCurrencyISOCode>MXN</m:sCurrencyISOCode><m:sCountryFlag>http://flag</m:sCountryFlag>
				  <m:Languages>%s</m:Languages>
				</m:FullCountryInfoResult></m:FullCountryInfoResponse>""".formatted(NS, iso, name, languages));
	}

	@Test
	void mapsFoundCountry() {
		server.expect(payload(request("MX")))
			.andRespond(withPayload(response("MX", "Mexico",
					"<m:tLanguage><m:sISOCode>es</m:sISOCode><m:sName>Spanish</m:sName></m:tLanguage>")));

		var country = client.find("MX").orElseThrow();

		assertThat(country.name()).isEqualTo("Mexico");
		assertThat(country.currency()).isEqualTo("MXN");
		assertThat(country.languages()).containsExactly("Spanish");
		server.verify();
	}

	@Test
	void emptyIsoCodeMeansNotFound() {
		server.expect(payload(request("ZZ")))
			.andRespond(withPayload(response("", "Country not found in the database", "")));

		assertThat(client.find("ZZ")).isEmpty();
		server.verify();
	}

}
