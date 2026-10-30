package com.practice.api.external;

import java.util.List;
import java.util.Optional;

import com.practice.api.external.countryinfo.FullCountryInfo;
import com.practice.api.external.countryinfo.FullCountryInfoResponse;
import com.practice.api.external.countryinfo.TCountryInfo;
import com.practice.api.external.countryinfo.TLanguage;

import org.springframework.ws.client.core.WebServiceTemplate;

/** Cliente SOAP de CountryInfo, con clases generadas desde wsdl/countryinfo.wsdl. */
public class CountryInfoClient {

	private final WebServiceTemplate template;

	public CountryInfoClient(WebServiceTemplate template) {
		this.template = template;
	}

	public Optional<Country> find(String isoCode) {
		FullCountryInfo request = new FullCountryInfo();
		request.setSCountryISOCode(isoCode);
		FullCountryInfoResponse response = (FullCountryInfoResponse) template.marshalSendAndReceive(request);
		TCountryInfo info = response.getFullCountryInfoResult();
		// El servicio no manda Fault si no existe: responde 200 con sISOCode vacío
		if (info == null || info.getSISOCode() == null || info.getSISOCode().isBlank()) {
			return Optional.empty();
		}
		List<String> languages = info.getLanguages() == null ? List.of()
				: info.getLanguages().getTLanguage().stream().map(TLanguage::getSName).toList();
		return Optional.of(new Country(info.getSISOCode(), info.getSName(), info.getSCapitalCity(),
				info.getSCurrencyISOCode(), info.getSCountryFlag(), languages));
	}

	public record Country(String isoCode, String name, String capital, String currency, String flagUrl,
			List<String> languages) {
	}

}
