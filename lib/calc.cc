#include <emscripten/bind.h>
#include <libqalculate/Calculator.h>
#include <libqalculate/Variable.h>

using namespace emscripten;

Calculator calc;
EvaluationOptions evalops;
PrintOptions printops;

#include "settings.h"

struct Calculation
{
	std::string input;
	std::string output;
	std::string messages;
};

Calculation calculate(std::string calculation, int timeout = 500, int optionFlags = 0)
{
	calculator->clearMessages();

	calculation = calc.unlocalizeExpression(calculation, evalops.parse_options);
	std::string parsed_str;
	bool resultIsComparison;
	auto result = calc.calculateAndPrint(calculation, timeout, evalops, printops, AUTOMATIC_FRACTION_AUTO, AUTOMATIC_APPROXIMATION_AUTO, &parsed_str, -1, &resultIsComparison, true, 2, TAG_TYPE_HTML);

	Calculation ret;
	ret.input = parsed_str;
	ret.output = result;
	CalculatorMessage *message;
	if ((message = calculator->message()))
	{
		auto msgType = message->type();
		std::string severity = msgType == MESSAGE_INFORMATION ? "Info" : msgType == MESSAGE_WARNING ? "Warning"
																									: "Error";
		ret.messages += severity + ": " + message->message() + "\n";
	}

	return ret;
}

val getVariables()
{
	auto variables = val::array();
	for (auto &variable : calc.variables)
	{
		if (!variable->isKnown() || variable->isHidden())
			continue;

		auto info = val::object();
		info.set("name", variable->preferredDisplayName(true, true).name);
		info.set("description", variable->title(false, true));
		auto nameCount = variable->countNames();
		auto aliases = val::array();
		if (nameCount < 1)
		{
			aliases.call<void>("push", variable->preferredDisplayName(true, true).name);
		}
		else
		{
			for (size_t i = 1; i <= nameCount; i++)
			{
				aliases.call<void>("push", variable->getName(i).name);
			}
		}
		info.set("aliases", aliases);
		variables.call<void>("push", info);
	}
	return variables;
}

int updateCurrencyValues(const val &currencyData, std::string baseCurrency, bool showWarning)
{
	int errorCode = 0;

	auto u1 = CALCULATOR->getActiveUnit(baseCurrency);
	if (u1 != calc.u_euro)
	{
		return 1;
	}

	for (int i = 0; i < currencyData["length"].as<int>(); i++)
	{
		emscripten::val data = currencyData[i];
		auto name = data["name"].as<std::string>();
		auto value = data["value"].as<std::string>();
		auto u2 = calculator->getActiveUnit(name);
		if (!u2)
		{
			u2 = calc.addUnit(new AliasUnit(_("Currency"), name, "", "", "", calc.u_euro, "1", 1, "", false, true));
		}
		else if (!u2->isCurrency())
		{
			errorCode = 2;
			continue;
		}

		((AliasUnit *)u2)->setBaseUnit(u1);
		((AliasUnit *)u2)->setExpression(value);
		u2->setApproximate();
		u2->setPrecision(-2);
		u2->setChanged(false);
	}

	calc.setExchangeRatesWarningEnabled(showWarning);
	calc.loadGlobalCurrencies();

	return errorCode;
}

int main()
{
	calc.loadGlobalDefinitions();
	printops.use_unicode_signs = true;
	printops.interval_display = INTERVAL_DISPLAY_SIGNIFICANT_DIGITS;
	printops.base_display = BASE_DISPLAY_NORMAL;
	printops.digit_grouping = DIGIT_GROUPING_STANDARD;
	printops.indicate_infinite_series = true;
	evalops.parse_options.angle_unit = ANGLE_UNIT_RADIANS;
	evalops.parse_options.unknowns_enabled = false;
	return 0;
}

std::string info()
{
	return "libqalculate by Hanna Knutsson, wrapped & compiled by Stephan Troyer";
}

int version()
{
	return 4;
}

EMSCRIPTEN_BINDINGS(Calculator)
{
	function("calculate", &calculate);
	function("info", &info);
	function("version", &version);
	function("getVariables", &getVariables);
	function("set_option", &set_option);
	function("updateCurrencyValues", &updateCurrencyValues);
}

EMSCRIPTEN_BINDINGS(calculation)
{
	class_<Calculation>("Calculation")
		.constructor<>()
		.property("input", &Calculation::input)
		.property("output", &Calculation::output)
		.property("messages", &Calculation::messages);
}
