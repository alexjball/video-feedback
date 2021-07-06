import numpy as np

from feedback.basic import BasicSimulation
from feedback.simulation import Points
from feedback.portal import Transformation

p = Points(x_min=-5, x_max=5, y_min=-5, y_max=5, width=10, height=10)

simulation = BasicSimulation(-3, 3, -3, 3)

simulation.run(p)
print(p.data["depth"])

t = Transformation(t_x=1, degrees=45)
print(t.m)


a = np.matmul(t, Transformation(t_y=3))
print(a)
