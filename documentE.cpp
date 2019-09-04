/**
 * Поклонение симулятору Сиюань
 * Уровень 3 Истина до уровня 4 Истина
 * Ты силен для тебя, я никогда не покажу слабости!
 * Используйте Google Translate. Я не знаю русского, не бей меня!
 */

#include <bits/stdc++.h>

typedef unsigned long dist_t;
typedef unsigned long res_t;
const int COST_MIN = 160;
const int COST_MAX = 220;
const int RESOURCE_COUNT = 3;
const std::string RESOURCE_NAMES[RESOURCE_COUNT] = {
	"драгоценный камень",
	"Волшебный камень",
	"объектив",
};

template <class T>
class RandomGen
{
	T _min, _max;
	size_t _range;

public:
	RandomGen(T __min, T __max) : _min(__min), _max(__max)
	{
		_range = _max - _min;
	}
	T random()
	{
		return rand() % _range + _min;
	}
	inline T min()
	{
		return _min;
	}
	inline T max()
	{
		return _max;
	}
};

/* Ресурс */
struct Resource
{
	std::string name;
	Resource(std::string _name) : name(_name) {}
};

/* лаборатория */
template <class RNG, int MIN, int MAX>
class Lab
{
	std::vector<Resource> resourceList;
	RNG *needGen;
	std::vector<res_t> needList;

public:
	Lab()
	{
		needGen = new RNG(MIN, MAX);
	}
	void registerResource(Resource res)
	{
		resourceList.push_back(res);
		needList.push_back(needGen->random());
	}
	size_t size()
	{
		return resourceList.size();
	}
	dist_t run(std::vector<res_t> (*query)(dist_t dist))
	{
		const int DIS_MOD = 9;
		std::vector<res_t> result;
		int totalTime = 0;
		/* Очевидно, разрыв всегда неотрицателен. */
		dist_t lastDist = 0;
		do
		{
			totalTime++;
			result = query(lastDist);
			lastDist = 0;
			for (size_t i = 0; i < size(); i++)
			{
				dist_t offset = abs(needList[i] - result[i]);
				lastDist ^= offset;
			}
			lastDist %= DIS_MOD;
			/* Предотвратить общий разрыв равным 0 */
			lastDist += 1;
		} while (result != needList);
		return totalTime;
	}
};

std::vector<res_t> ask(dist_t lastDist)
{
	std::vector<res_t> input;
	if (lastDist != 0)
	{
		std::cout << "Последнее расстояние было " << lastDist << "." << std::endl;
	}
	for (int i = 0; i < RESOURCE_COUNT; i++)
	{
		int value;
		do
		{
			std::cout << RESOURCE_NAMES[i] << ":";
			std::cin >> value;
		} while (value < COST_MIN || value > COST_MAX);
		input.push_back(value);
	}
	return input;
}

unsigned int doExperiment()
{
	Lab<RandomGen<int>, COST_MIN, COST_MAX> currentLab;
	for (int i = 0; i < RESOURCE_COUNT; i++)
	{
		currentLab.registerResource(Resource(RESOURCE_NAMES[i]));
	}
	return currentLab.run(ask);
}

int main()
{
	for (int i = 1;; i++)
	{
		std::cout << "Раунд " << i << std::endl;
		unsigned int time = doExperiment();
		std::cout << "Использовано " << time << " попытки." << std::endl;
	}
	return 0;
}

/**
 * В этом приложении есть ошибка.
 * Но последний человек, который принял программу,
 * был слишком ересью, я не буду это исправлять для него!
 * Пусть он окажется в ловушке этой ошибки!
 * - LMOliver
 */